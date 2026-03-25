"use server";

import { createClient } from "@/lib/supabase/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { xpLog, userProgress, reviewSchedule } from "@/db/schema";

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

  const practiceXp = correctCount * XP_PER_CORRECT;

  await db.insert(xpLog).values({
    userId: user.id,
    topicId,
    activityType: "practice_session",
    xpAmount: practiceXp,
  });

  if (passed) {
    await db.insert(xpLog).values({
      userId: user.id,
      topicId,
      activityType: "topic_completed",
      xpAmount: TOPIC_COMPLETED_BONUS,
    });

    await db
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

    await db
      .insert(reviewSchedule)
      .values({ userId: user.id, topicId, nextReviewAt: tomorrow })
      .onConflictDoNothing();
  }
}
