import { and, eq, sum, count, inArray } from "drizzle-orm";
import { db } from "@/db";
import { courses, topics, userProgress, xpLog } from "@/db/schema";

export type CourseSummary = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  state: "not_started" | "in_progress" | "completed";
  progressPercent: number;
  totalXp: number;
  earnedXp: number;
};

export async function getAllCoursesData(
  userId: string,
): Promise<CourseSummary[]> {
  const courseRows = await db
    .select()
    .from(courses)
    .where(eq(courses.isPublished, true))
    .orderBy(courses.sortOrder);

  if (courseRows.length === 0) return [];

  const courseIds = courseRows.map((c) => c.id);

  const [topicAggRows, progressRows, xpRows] = await Promise.all([
    db
      .select({
        courseId: topics.courseId,
        totalTopics: count(topics.id),
        totalXp: sum(topics.totalXp),
      })
      .from(topics)
      .where(inArray(topics.courseId, courseIds))
      .groupBy(topics.courseId),

    db
      .select({
        courseId: topics.courseId,
        status: userProgress.status,
        total: count(),
      })
      .from(userProgress)
      .innerJoin(topics, eq(userProgress.topicId, topics.id))
      .where(
        and(
          eq(userProgress.userId, userId),
          inArray(topics.courseId, courseIds),
        ),
      )
      .groupBy(topics.courseId, userProgress.status),

    db
      .select({
        courseId: topics.courseId,
        earned: sum(xpLog.xpAmount),
      })
      .from(xpLog)
      .innerJoin(topics, eq(xpLog.topicId, topics.id))
      .where(
        and(
          eq(xpLog.userId, userId),
          inArray(xpLog.activityType, ["practice_session", "topic_completed"]),
          inArray(topics.courseId, courseIds),
        ),
      )
      .groupBy(topics.courseId),
  ]);

  const topicAgg = new Map<string, { totalTopics: number; totalXp: number }>();
  for (const r of topicAggRows) {
    topicAgg.set(r.courseId, {
      totalTopics: Number(r.totalTopics),
      totalXp: Number(r.totalXp ?? 0),
    });
  }

  const completedByCourse = new Map<string, number>();
  const inProgressByCourse = new Map<string, number>();
  for (const r of progressRows) {
    const total = Number(r.total);
    if (r.status === "completed") {
      completedByCourse.set(r.courseId, total);
    } else if (r.status === "in_progress") {
      inProgressByCourse.set(r.courseId, total);
    }
  }

  const earnedByCourse = new Map<string, number>();
  for (const r of xpRows) {
    earnedByCourse.set(r.courseId, Number(r.earned ?? 0));
  }

  return courseRows.map((c) => {
    const agg = topicAgg.get(c.id) ?? { totalTopics: 0, totalXp: 0 };
    const completedTopics = completedByCourse.get(c.id) ?? 0;
    const inProgressTopics = inProgressByCourse.get(c.id) ?? 0;
    const earnedXp = earnedByCourse.get(c.id) ?? 0;

    const state: CourseSummary["state"] =
      agg.totalTopics > 0 && completedTopics === agg.totalTopics
        ? "completed"
        : completedTopics > 0 || inProgressTopics > 0
          ? "in_progress"
          : "not_started";

    const progressPercent =
      agg.totalTopics === 0
        ? 0
        : Math.round((completedTopics / agg.totalTopics) * 100);

    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      totalTopics: agg.totalTopics,
      completedTopics,
      inProgressTopics,
      state,
      progressPercent,
      totalXp: agg.totalXp,
      earnedXp,
    };
  });
}
