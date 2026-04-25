import { eq, sum, sql, count, lte, and, inArray, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  profiles,
  courses,
  topics,
  topicPrerequisites,
  userProgress,
  xpLog,
  reviewSchedule,
  reviewSessions,
  slides,
  practiceQuestions,
  practiceQuestionProgress,
} from "@/db/schema";

// ── Ensure profile exists for new users ─────────────────────────────────────

export async function ensureProfile(userId: string) {
  await db
    .insert(profiles)
    .values({ id: userId })
    .onConflictDoNothing({ target: profiles.id });
}

// ── Dashboard data fetching ─────────────────────────────────────────────────

async function resolveMostRecentCourseSlug(
  userId: string,
): Promise<string | null> {
  const rows = await db
    .select({ slug: courses.slug })
    .from(userProgress)
    .innerJoin(topics, eq(userProgress.topicId, topics.id))
    .innerJoin(courses, eq(topics.courseId, courses.id))
    .where(eq(userProgress.userId, userId))
    .orderBy(desc(userProgress.updatedAt))
    .limit(1);
  return rows[0]?.slug ?? null;
}

export async function getDashboardData(
  userId: string,
  courseSlug?: string,
) {
  const resolvedSlug =
    courseSlug ?? (await resolveMostRecentCourseSlug(userId));

  if (!resolvedSlug) {
    const [profile, xpResult] = await Promise.all([
      db.query.profiles.findFirst({ where: eq(profiles.id, userId) }),
      db
        .select({ total: sum(xpLog.xpAmount) })
        .from(xpLog)
        .where(
          and(
            eq(xpLog.userId, userId),
            inArray(xpLog.activityType, [
              "practice_session",
              "topic_completed",
            ]),
          ),
        ),
    ]);
    return {
      course: null,
      topics: [],
      prerequisites: [],
      progressRows: [],
      totalXp: Number(xpResult[0]?.total ?? 0),
      profile: profile ?? null,
      dueReviewCount: 0,
      inProgressReview: null,
      slideCounts: new Map<string, number>(),
      questionCounts: new Map<string, number>(),
      correctAnswers: new Map<string, number>(),
    };
  }

  const [
    course,
    allTopics,
    prerequisites,
    progressRows,
    xpResult,
    profile,
    dueReviewResult,
    inProgressReviewRow,
    slideCountRows,
    questionCountRows,
    correctAnswerRows,
  ] =
    await Promise.all([
      // Course
      db.query.courses.findFirst({
        where: eq(courses.slug, resolvedSlug),
      }),

      // All topics for this course (by slug lookup)
      db
        .select()
        .from(topics)
        .innerJoin(courses, eq(topics.courseId, courses.id))
        .where(eq(courses.slug, resolvedSlug))
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
        .where(eq(courses.slug, resolvedSlug)),

      // User progress
      db
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId)),

      // Total XP (course XP only — excludes review_completed and streak_bonus)
      db
        .select({ total: sum(xpLog.xpAmount) })
        .from(xpLog)
        .where(
          and(
            eq(xpLog.userId, userId),
            inArray(xpLog.activityType, [
              "practice_session",
              "topic_completed",
            ]),
          ),
        ),

      // Profile
      db.query.profiles.findFirst({
        where: eq(profiles.id, userId),
      }),

      // Due reviews
      db
        .select({ total: count() })
        .from(reviewSchedule)
        .where(
          and(
            eq(reviewSchedule.userId, userId),
            lte(reviewSchedule.nextReviewAt, new Date()),
          ),
        ),

      // In-progress review session (if any)
      db
        .select({
          id: reviewSessions.id,
          currentIndex: reviewSessions.currentIndex,
          questions: reviewSessions.questions,
        })
        .from(reviewSessions)
        .where(
          and(
            eq(reviewSessions.userId, userId),
            eq(reviewSessions.status, "in_progress"),
          ),
        )
        .limit(1),

      // Slide counts per topic (for this course)
      db
        .select({ topicId: slides.topicId, total: count() })
        .from(slides)
        .innerJoin(topics, eq(slides.topicId, topics.id))
        .innerJoin(courses, eq(topics.courseId, courses.id))
        .where(eq(courses.slug, resolvedSlug))
        .groupBy(slides.topicId),

      // Practice question counts per topic (for this course)
      db
        .select({ topicId: practiceQuestions.topicId, total: count() })
        .from(practiceQuestions)
        .innerJoin(topics, eq(practiceQuestions.topicId, topics.id))
        .innerJoin(courses, eq(topics.courseId, courses.id))
        .where(eq(courses.slug, resolvedSlug))
        .groupBy(practiceQuestions.topicId),

      // Correct practice answers per topic for this user
      db
        .select({ topicId: practiceQuestions.topicId, total: count() })
        .from(practiceQuestionProgress)
        .innerJoin(
          practiceQuestions,
          eq(practiceQuestionProgress.practiceQuestionId, practiceQuestions.id),
        )
        .innerJoin(topics, eq(practiceQuestions.topicId, topics.id))
        .innerJoin(courses, eq(topics.courseId, courses.id))
        .where(
          and(
            eq(practiceQuestionProgress.userId, userId),
            eq(practiceQuestionProgress.isCorrect, true),
            eq(courses.slug, resolvedSlug),
          ),
        )
        .groupBy(practiceQuestions.topicId),
    ]);

  const toCountMap = (rows: { topicId: string; total: number }[]) => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.topicId, Number(r.total));
    return m;
  };

  return {
    course: course ?? null,
    topics: allTopics.map((row) => row.topics),
    prerequisites,
    progressRows,
    totalXp: Number(xpResult[0]?.total ?? 0),
    profile: profile ?? null,
    dueReviewCount: Number(dueReviewResult[0]?.total ?? 0),
    inProgressReview: inProgressReviewRow[0]
      ? {
          currentIndex: inProgressReviewRow[0].currentIndex,
          totalQuestions: inProgressReviewRow[0].questions.length,
        }
      : null,
    slideCounts: toCountMap(slideCountRows),
    questionCounts: toCountMap(questionCountRows),
    correctAnswers: toCountMap(correctAnswerRows),
  };
}

// ── Pure function: compute topic statuses ───────────────────────────────────

type TopicRow = {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  sortOrder: number;
  totalXp: number;
};

type ProgressRow = {
  topicId: string;
  status: "locked" | "available" | "in_progress" | "completed";
  currentSlideIndex?: number;
  updatedAt?: Date;
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

// ── Compute continue/start-learning card ────────────────────────────────────

export type ContinueCard = {
  mode: "continue" | "start";
  topic: TopicWithStatus;
  progressPercent: number;
};

export function computeContinueCard(
  topicsWithStatus: TopicWithStatus[],
  progressRows: ProgressRow[],
  slideCounts: Map<string, number>,
  questionCounts: Map<string, number>,
  correctAnswers: Map<string, number>,
): ContinueCard | null {
  const inProgressRows = progressRows
    .filter((r) => r.status === "in_progress" && r.updatedAt)
    .sort(
      (a, b) =>
        (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0),
    );

  const calcPercent = (topicId: string, currentSlideIndex: number) => {
    const totalSlides = slideCounts.get(topicId) ?? 0;
    const totalQuestions = questionCounts.get(topicId) ?? 0;
    const correct = correctAnswers.get(topicId) ?? 0;
    const denom = totalSlides + totalQuestions;
    if (denom === 0) return 0;
    const numerator = Math.min(currentSlideIndex, totalSlides) + correct;
    return Math.round((numerator / denom) * 100);
  };

  for (const row of inProgressRows) {
    const topic = topicsWithStatus.find((t) => t.id === row.topicId);
    if (!topic) continue;
    return {
      mode: "continue",
      topic,
      progressPercent: calcPercent(row.topicId, row.currentSlideIndex ?? 0),
    };
  }

  const startTopic = topicsWithStatus.find((t) => t.status === "available");
  if (startTopic) {
    return { mode: "start", topic: startTopic, progressPercent: 0 };
  }

  return null;
}
