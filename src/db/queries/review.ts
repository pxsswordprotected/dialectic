import { eq, lte, and, asc, sql, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  reviewSchedule,
  reviewSessions,
  topics,
  practiceQuestions,
} from "@/db/schema";

type SessionQuestion = {
  id: string;
  questionType: string;
  prompt: string;
  questionData: unknown;
  explanation: string | null;
  topicId: string;
  topicTitle: string;
};

export type ReviewSessionData = {
  sessionId: string;
  questions: SessionQuestion[];
  answers: Record<string, boolean>;
  currentIndex: number;
  dueTopics: Array<{ id: string; title: string }>;
};

async function hydrateSession(
  sessionId: string,
  plan: Array<{ questionId: string; topicId: string }>,
  answers: Record<string, boolean>,
  currentIndex: number,
): Promise<ReviewSessionData> {
  const questionIds = plan.map((p) => p.questionId);
  const topicIds = Array.from(new Set(plan.map((p) => p.topicId)));

  const [questionRows, topicRows] = await Promise.all([
    db
      .select({
        id: practiceQuestions.id,
        questionType: practiceQuestions.questionType,
        prompt: practiceQuestions.prompt,
        questionData: practiceQuestions.questionData,
        explanation: practiceQuestions.explanation,
      })
      .from(practiceQuestions)
      .where(inArray(practiceQuestions.id, questionIds)),
    db
      .select({ id: topics.id, title: topics.title })
      .from(topics)
      .where(inArray(topics.id, topicIds)),
  ]);

  const questionMap = new Map(questionRows.map((q) => [q.id, q]));
  const topicTitleMap = new Map(topicRows.map((t) => [t.id, t.title]));

  const questions: SessionQuestion[] = [];
  for (const p of plan) {
    const q = questionMap.get(p.questionId);
    if (!q) continue;
    questions.push({
      ...q,
      topicId: p.topicId,
      topicTitle: topicTitleMap.get(p.topicId) ?? "",
    });
  }

  const dueTopics = topicIds.map((id) => ({
    id,
    title: topicTitleMap.get(id) ?? "",
  }));

  return { sessionId, questions, answers, currentIndex, dueTopics };
}

export async function getOrCreateReviewSession(
  userId: string,
): Promise<ReviewSessionData | null> {
  const [existing] = await db
    .select()
    .from(reviewSessions)
    .where(
      and(
        eq(reviewSessions.userId, userId),
        eq(reviewSessions.status, "in_progress"),
      ),
    )
    .limit(1);

  if (existing) {
    return hydrateSession(
      existing.id,
      existing.questions,
      existing.answers,
      existing.currentIndex,
    );
  }

  const dueTopics = await db
    .select({
      topicId: reviewSchedule.topicId,
      topicTitle: topics.title,
    })
    .from(reviewSchedule)
    .innerJoin(topics, eq(reviewSchedule.topicId, topics.id))
    .where(
      and(
        eq(reviewSchedule.userId, userId),
        lte(reviewSchedule.nextReviewAt, new Date()),
      ),
    )
    .orderBy(asc(reviewSchedule.nextReviewAt));

  if (dueTopics.length === 0) return null;

  const plan: Array<{ questionId: string; topicId: string }> = [];

  for (const dt of dueTopics) {
    const qs = await db
      .select({ id: practiceQuestions.id })
      .from(practiceQuestions)
      .where(eq(practiceQuestions.topicId, dt.topicId))
      .orderBy(sql`random()`)
      .limit(4);

    for (const q of qs) {
      plan.push({ questionId: q.id, topicId: dt.topicId });
    }
  }

  if (plan.length === 0) return null;

  // Shuffle to interleave topics
  for (let i = plan.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [plan[i], plan[j]] = [plan[j], plan[i]];
  }

  const [created] = await db
    .insert(reviewSessions)
    .values({
      userId,
      questions: plan,
      answers: {},
      currentIndex: 0,
    })
    .returning({ id: reviewSessions.id });

  return hydrateSession(created.id, plan, {}, 0);
}

export async function hasInProgressReviewSession(
  userId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: reviewSessions.id })
    .from(reviewSessions)
    .where(
      and(
        eq(reviewSessions.userId, userId),
        eq(reviewSessions.status, "in_progress"),
      ),
    )
    .limit(1);
  return Boolean(row);
}
