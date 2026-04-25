"use server";

import { and, asc, eq, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import {
  practiceQuestionProgress,
  practiceQuestions,
  practiceSessions,
  userProgress,
} from "@/db/schema";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export type PracticeSessionState = {
  id: string;
  questions: string[];
  answers: Record<string, boolean>;
  currentIndex: number;
};

export async function startPracticeSession(
  topicId: string,
): Promise<PracticeSessionState> {
  const userId = await getUserId();

  return await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(practiceSessions)
      .where(
        and(
          eq(practiceSessions.userId, userId),
          eq(practiceSessions.topicId, topicId),
          eq(practiceSessions.status, "in_progress"),
        ),
      )
      .for("update")
      .limit(1);

    if (existing) {
      return {
        id: existing.id,
        questions: existing.questions,
        answers: existing.answers,
        currentIndex: existing.currentIndex,
      };
    }

    const questionRows = await tx
      .select({ id: practiceQuestions.id })
      .from(practiceQuestions)
      .where(eq(practiceQuestions.topicId, topicId))
      .orderBy(asc(practiceQuestions.sortOrder));

    const questionIds = questionRows.map((r) => r.id);

    const [created] = await tx
      .insert(practiceSessions)
      .values({
        userId,
        topicId,
        questions: questionIds,
        answers: {},
        currentIndex: 0,
        status: "in_progress",
      })
      .returning();

    return {
      id: created.id,
      questions: created.questions,
      answers: created.answers,
      currentIndex: created.currentIndex,
    };
  });
}

export async function savePracticeAnswer(
  sessionId: string,
  questionId: string,
  correct: boolean,
) {
  const userId = await getUserId();

  await db.transaction(async (tx) => {
    const [session] = await tx
      .select()
      .from(practiceSessions)
      .where(
        and(
          eq(practiceSessions.id, sessionId),
          eq(practiceSessions.userId, userId),
        ),
      )
      .for("update")
      .limit(1);

    if (!session || session.status !== "in_progress") return;

    const nextAnswers = { ...session.answers, [questionId]: correct };
    const index = session.questions.indexOf(questionId);
    const nextIndex =
      index >= 0
        ? Math.max(session.currentIndex, index + 1)
        : session.currentIndex;

    await tx
      .update(practiceSessions)
      .set({ answers: nextAnswers, currentIndex: nextIndex })
      .where(eq(practiceSessions.id, sessionId));

    await tx
      .update(userProgress)
      .set({ updatedAt: new Date() })
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.topicId, session.topicId),
        ),
      );

    await tx
      .insert(practiceQuestionProgress)
      .values({
        userId,
        practiceQuestionId: questionId,
        isCorrect: correct,
        attempts: 1,
        lastAttemptAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          practiceQuestionProgress.userId,
          practiceQuestionProgress.practiceQuestionId,
        ],
        set: {
          isCorrect: sql`${practiceQuestionProgress.isCorrect} OR ${correct}`,
          attempts: sql`${practiceQuestionProgress.attempts} + 1`,
          lastAttemptAt: new Date(),
          updatedAt: new Date(),
        },
      });
  });
}

export async function completePracticeSession(sessionId: string) {
  const userId = await getUserId();

  await db
    .update(practiceSessions)
    .set({ status: "completed", completedAt: sql`now()` })
    .where(
      and(
        eq(practiceSessions.id, sessionId),
        eq(practiceSessions.userId, userId),
        eq(practiceSessions.status, "in_progress"),
      ),
    );
}
