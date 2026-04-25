"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { xpLog, userProgress, reviewSchedule } from "@/db/schema";
import { updateStreakOnXpEarned } from "./streak";

const XP_PER_CORRECT = 5;
const TOPIC_COMPLETED_BONUS = 5;

export async function logPracticeXp(
  topicId: string,
  correctCount: number,
  passed: boolean,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  await db.transaction(async (tx) => {
    const practiceXp = correctCount * XP_PER_CORRECT;

    await tx.insert(xpLog).values({
      userId: user.id,
      topicId,
      activityType: "practice_session",
      xpAmount: practiceXp,
    });

    if (passed) {
      await tx.insert(xpLog).values({
        userId: user.id,
        topicId,
        activityType: "topic_completed",
        xpAmount: TOPIC_COMPLETED_BONUS,
      });

      await tx
        .insert(userProgress)
        .values({
          userId: user.id,
          topicId,
          status: "completed",
          completedAt: new Date(),
        })
        .onConflictDoNothing();

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await tx
        .insert(reviewSchedule)
        .values({ userId: user.id, topicId, nextReviewAt: tomorrow })
        .onConflictDoNothing();
    }

    const earned = practiceXp + (passed ? TOPIC_COMPLETED_BONUS : 0);
    if (earned > 0) {
      await updateStreakOnXpEarned(tx, user.id);
    }
  });
}
