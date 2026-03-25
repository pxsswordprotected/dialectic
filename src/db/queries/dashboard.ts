import { eq, sum, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  profiles,
  courses,
  topics,
  topicPrerequisites,
  userProgress,
  xpLog,
} from "@/db/schema";

// ── Ensure profile exists for new users ─────────────────────────────────────

export async function ensureProfile(userId: string) {
  await db
    .insert(profiles)
    .values({ id: userId })
    .onConflictDoNothing({ target: profiles.id });
}

// ── Dashboard data fetching ─────────────────────────────────────────────────

export async function getDashboardData(userId: string) {
  const [course, allTopics, prerequisites, progressRows, xpResult, profile] =
    await Promise.all([
      // Course
      db.query.courses.findFirst({
        where: eq(courses.slug, "intro-logic"),
      }),

      // All topics for this course (by slug lookup)
      db
        .select()
        .from(topics)
        .innerJoin(courses, eq(topics.courseId, courses.id))
        .where(eq(courses.slug, "intro-logic"))
        .orderBy(topics.sortOrder),

      // All prerequisites for topics in this course
      db
        .select({
          topicId: topicPrerequisites.topicId,
          prerequisiteTopicId: topicPrerequisites.prerequisiteTopicId,
        })
        .from(topicPrerequisites)
        .innerJoin(topics, eq(topicPrerequisites.topicId, topics.id))
        .innerJoin(courses, eq(topics.courseId, courses.id))
        .where(eq(courses.slug, "intro-logic")),

      // User progress
      db
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId)),

      // Total XP
      db
        .select({ total: sum(xpLog.xpAmount) })
        .from(xpLog)
        .where(eq(xpLog.userId, userId)),

      // Profile
      db.query.profiles.findFirst({
        where: eq(profiles.id, userId),
      }),
    ]);

  return {
    course: course ?? null,
    topics: allTopics.map((row) => row.topics),
    prerequisites,
    progressRows,
    totalXp: Number(xpResult[0]?.total ?? 0),
    profile: profile ?? null,
  };
}

// ── Pure function: compute topic statuses ───────────────────────────────────

type TopicRow = {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
};

type ProgressRow = {
  topicId: string;
  status: "locked" | "available" | "in_progress" | "completed";
};

type PrerequisiteRow = {
  topicId: string;
  prerequisiteTopicId: string;
};

export type TopicWithStatus = TopicRow & {
  status: "locked" | "available" | "in_progress" | "completed";
};

export function computeTopicStatuses(
  topicRows: TopicRow[],
  progressRows: ProgressRow[],
  prerequisites: PrerequisiteRow[],
) {
  // Sort by sortOrder
  const sorted = [...topicRows].sort((a, b) => a.sortOrder - b.sortOrder);

  // Build progress map
  const progressMap = new Map<string, ProgressRow["status"]>();
  for (const row of progressRows) {
    progressMap.set(row.topicId, row.status);
  }

  // Build prerequisite map: topicId -> prerequisiteTopicIds[]
  const prereqMap = new Map<string, string[]>();
  for (const row of prerequisites) {
    const existing = prereqMap.get(row.topicId) ?? [];
    existing.push(row.prerequisiteTopicId);
    prereqMap.set(row.topicId, existing);
  }

  // Compute statuses
  const topicsWithStatus: TopicWithStatus[] = sorted.map((topic) => {
    const existingStatus = progressMap.get(topic.id);
    if (existingStatus) {
      return { ...topic, status: existingStatus };
    }

    // No progress row — derive status from prerequisites
    const prereqs = prereqMap.get(topic.id) ?? [];
    if (prereqs.length === 0) {
      return { ...topic, status: "available" as const };
    }

    const allPrereqsCompleted = prereqs.every(
      (pid) => progressMap.get(pid) === "completed",
    );
    return {
      ...topic,
      status: allPrereqsCompleted ? ("available" as const) : ("locked" as const),
    };
  });

  // Derive continue topic
  const continueTopic =
    topicsWithStatus.find((t) => t.status === "in_progress") ??
    topicsWithStatus.find((t) => t.status === "available") ??
    null;

  const completedCount = topicsWithStatus.filter(
    (t) => t.status === "completed",
  ).length;

  return { topicsWithStatus, continueTopic, completedCount };
}
