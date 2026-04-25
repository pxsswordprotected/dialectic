"use server";

import { createClient } from "@/lib/supabase/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { reviewSchedule, reviewSessions, xpLog } from "@/db/schema";
import { updateStreakOnXpEarned } from "./streak";

const XP_PER_CORRECT = 5;

export async function saveReviewAnswer(
  sessionId: string,
  questionId: string,
  correct: boolean,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  await db.transaction(async (tx) => {
    const [session] = await tx
      .select()
      .from(reviewSessions)
      .where(
        and(
          eq(reviewSessions.id, sessionId),
          eq(reviewSessions.userId, user.id),
        ),
      )
      .for("update")
      .limit(1);

    if (!session || session.status !== "in_progress") return;

    const nextAnswers = { ...session.answers, [questionId]: correct };
    const index = session.questions.findIndex(
      (q) => q.questionId === questionId,
    );
    const nextIndex =
      index >= 0
        ? Math.max(session.currentIndex, index + 1)
        : session.currentIndex;

    await tx
      .update(reviewSessions)
      .set({ answers: nextAnswers, currentIndex: nextIndex })
      .where(eq(reviewSessions.id, sessionId));
  });
}

export async function completeReviewSession(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  await db.transaction(async (tx) => {
    const [session] = await tx
      .select()
      .from(reviewSessions)
      .where(
        and(
          eq(reviewSessions.id, sessionId),
          eq(reviewSessions.userId, user.id),
        ),
      )
      .for("update")
      .limit(1);

    if (!session || session.status !== "in_progress") return;

    // Group results by topicId from stored plan + answers
    const byTopic = new Map<string, { correct: number; total: number }>();
    for (const q of session.questions) {
      const answered = q.questionId in session.answers;
      if (!answered) continue;
      const entry = byTopic.get(q.topicId) ?? { correct: 0, total: 0 };
      entry.total += 1;
      if (session.answers[q.questionId]) entry.correct += 1;
      byTopic.set(q.topicId, entry);
    }

    for (const [topicId, result] of byTopic) {
      const [schedule] = await tx
        .select()
        .from(reviewSchedule)
        .where(
          and(
            eq(reviewSchedule.userId, user.id),
            eq(reviewSchedule.topicId, topicId),
          ),
        )
        .for("update")
        .limit(1);

      if (!schedule) continue;

      const quality = Math.round((result.correct / result.total) * 5);

      // SM-2 ease factor update (harshened)
      const newEase = Math.max(
        1.3,
        schedule.easeFactor +
          0.1 -
          (5 - quality) * (0.08 + (5 - quality) * 0.02),
      );

      let newInterval: number;
      if (quality >= 3) {
        newInterval = schedule.intervalDays * newEase;
      } else {
        newInterval = 1;
      }

      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + Math.round(newInterval));

      await tx
        .update(reviewSchedule)
        .set({
          intervalDays: newInterval,
          easeFactor: newEase,
          reviewCount: schedule.reviewCount + 1,
          nextReviewAt: nextReview,
          updatedAt: new Date(),
        })
        .where(eq(reviewSchedule.id, schedule.id));

      await tx.insert(xpLog).values({
        userId: user.id,
        topicId,
        activityType: "review_completed",
        xpAmount: result.correct * XP_PER_CORRECT,
      });
    }

    await tx
      .update(reviewSessions)
      .set({ status: "completed", completedAt: sql`now()` })
      .where(eq(reviewSessions.id, sessionId));

    let totalEarned = 0;
    for (const [, result] of byTopic) {
      totalEarned += result.correct * XP_PER_CORRECT;
    }
    if (totalEarned > 0) {
      await updateStreakOnXpEarned(tx, user.id);
    }
  });
}
