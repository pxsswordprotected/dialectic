import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db";
import { topics, courses, slides, practiceQuestions } from "@/db/schema";

export async function getTopicWithSlides(topicSlug: string) {
  const topic = await db
    .select({
      id: topics.id,
      title: topics.title,
      description: topics.description,
      slug: topics.slug,
      totalXp: topics.totalXp,
      sortOrder: topics.sortOrder,
    })
    .from(topics)
    .innerJoin(courses, eq(topics.courseId, courses.id))
    .where(and(eq(topics.slug, topicSlug), eq(courses.slug, "intro-logic")))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!topic) return null;

  const topicSlides = await db
    .select({
      id: slides.id,
      sortOrder: slides.sortOrder,
      slideType: slides.slideType,
      heading: slides.heading,
      content: slides.content,
    })
    .from(slides)
    .where(eq(slides.topicId, topic.id))
    .orderBy(asc(slides.sortOrder));

  const questions = await db
    .select({
      id: practiceQuestions.id,
      sortOrder: practiceQuestions.sortOrder,
      questionType: practiceQuestions.questionType,
      prompt: practiceQuestions.prompt,
      questionData: practiceQuestions.questionData,
      explanation: practiceQuestions.explanation,
      difficulty: practiceQuestions.difficulty,
    })
    .from(practiceQuestions)
    .where(eq(practiceQuestions.topicId, topic.id))
    .orderBy(asc(practiceQuestions.sortOrder));

  return { topic, slides: topicSlides, questions };
}
