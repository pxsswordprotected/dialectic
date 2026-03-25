import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { eq } from "drizzle-orm";
import {
  courses,
  topics,
  topicPrerequisites,
  slides,
  practiceQuestions,
} from "./schema";

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf-8"));
}

// ── Types for seed data ──────────────────────────────────────────────────────

interface KnowledgeGraphNode {
  node_id: string;
  title: string;
  description: string;
  prerequisites: string[];
  assessment_type: string;
  example_task: string;
}

interface LessonSlide {
  type: "concept" | "example" | "rule" | "warning" | "summary";
  heading: string;
  body: string;
  examples: unknown[] | null;
  note: string | null;
}

interface PracticeQuestion {
  type: "multiple_choice" | "true_false" | "classify" | "fill_in" | "order";
  prompt: string;
  explanation: string;
  difficulty: number;
  targets_slide: number;
  [key: string]: unknown; // options, statement, answer, categories, items, etc.
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  const seedDataDir = join(__dirname, "seed-data", "courses");
  const courseDirs = readdirSync(seedDataDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const courseSlug of courseDirs) {
    const courseDir = join(seedDataDir, courseSlug);
    const graphPath = join(courseDir, "knowledge-graph.json");

    if (!existsSync(graphPath)) {
      console.log(`Skipping ${courseSlug}: no knowledge-graph.json`);
      continue;
    }

    const graph = readJson<KnowledgeGraphNode[]>(graphPath);

    // ── Delete existing course (cascade deletes topics, slides, etc.) ──
    await db.delete(courses).where(eq(courses.slug, courseSlug));

    // ── Insert course ────────────────────────────────────────────────────
    const courseTitle = courseSlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const [course] = await db
      .insert(courses)
      .values({
        title: courseTitle,
        slug: courseSlug,
        description: `Course: ${courseTitle}`,
        isPublished: true,
        sortOrder: 0,
      })
      .returning();

    console.log(`Created course: ${course.title} (${course.id})`);

    // ── Insert topics ────────────────────────────────────────────────────
    // Map node_id → inserted topic UUID for prerequisite wiring
    const nodeIdToTopicId = new Map<string, string>();

    for (let i = 0; i < graph.length; i++) {
      const node = graph[i];
      const topicSlug = slugify(node.title);

      const [topic] = await db
        .insert(topics)
        .values({
          courseId: course.id,
          title: node.title,
          description: node.description,
          slug: topicSlug,
          sortOrder: i,
          totalXp: 100,
        })
        .returning();

      nodeIdToTopicId.set(node.node_id, topic.id);
      console.log(`  Topic: ${topic.title} (${topicSlug})`);

      // ── Insert slides if lesson.json exists ────────────────────────────
      const nodePrefix = String(i + 1).padStart(2, "0");
      const nodesDir = join(courseDir, "nodes", `${nodePrefix}-${topicSlug}`);
      const lessonPath = join(nodesDir, "lesson.json");
      const slideIds: string[] = [];

      if (existsSync(lessonPath)) {
        const lessonSlides = readJson<LessonSlide[]>(lessonPath);

        for (let s = 0; s < lessonSlides.length; s++) {
          const slide = lessonSlides[s];
          const [inserted] = await db
            .insert(slides)
            .values({
              topicId: topic.id,
              sortOrder: s,
              slideType: slide.type,
              heading: slide.heading,
              content: {
                body: slide.body,
                examples: slide.examples,
                note: slide.note,
              },
            })
            .returning();

          slideIds.push(inserted.id);
        }
        console.log(`    ${slideIds.length} slides`);
      }

      // ── Insert practice questions if practice.json exists ──────────────
      const practicePath = join(nodesDir, "practice.json");

      if (existsSync(practicePath)) {
        const questions = readJson<PracticeQuestion[]>(practicePath);
        let qCount = 0;

        for (let q = 0; q < questions.length; q++) {
          const question = questions[q];
          const { type, prompt, explanation, difficulty, targets_slide, ...questionData } = question;

          await db.insert(practiceQuestions).values({
            topicId: topic.id,
            sortOrder: q,
            questionType: type,
            prompt,
            questionData,
            explanation,
            difficulty,
            targetsSlideId:
              targets_slide != null && slideIds[targets_slide]
                ? slideIds[targets_slide]
                : null,
          });
          qCount++;
        }
        console.log(`    ${qCount} practice questions`);
      }
    }

    // ── Wire up prerequisites ────────────────────────────────────────────
    let prereqCount = 0;
    for (const node of graph) {
      const topicId = nodeIdToTopicId.get(node.node_id);
      if (!topicId) continue;

      for (const prereqNodeId of node.prerequisites) {
        const prereqTopicId = nodeIdToTopicId.get(prereqNodeId);
        if (!prereqTopicId) {
          console.warn(`    Warning: prerequisite ${prereqNodeId} not found for ${node.node_id}`);
          continue;
        }

        await db.insert(topicPrerequisites).values({
          topicId,
          prerequisiteTopicId: prereqTopicId,
        });
        prereqCount++;
      }
    }
    console.log(`  ${prereqCount} prerequisite links`);
  }

  console.log("\nSeed complete.");
  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
