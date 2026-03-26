"use server";

import { createClient } from "@/lib/supabase/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { reviewSchedule, xpLog } from "@/db/schema";

const XP_PER_CORRECT = 5;

type TopicResult = {
  topicId: string;
  correctCount: number;
  totalCount: number;
};

export async function completeReviewSession(topicResults: TopicResult[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  await db.transaction(async (tx) => {
    for (const result of topicResults) {
      const [schedule] = await tx
        .select()
        .from(reviewSchedule)
        .where(
          and(
            eq(reviewSchedule.userId, user.id),
            eq(reviewSchedule.topicId, result.topicId),
          ),
        )
        .limit(1);

      if (!schedule) continue;

      const quality = Math.round((result.correctCount / result.totalCount) * 5);

      // SM-2 ease factor update (harshened)
      const newEase = Math.max(
        1.3,
        schedule.easeFactor +
          0.1 -
          (5 - quality) * (0.08 + (5 - quality) * 0.02),
      );

      // Interval update
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
        topicId: result.topicId,
        activityType: "review_completed",
        xpAmount: result.correctCount * XP_PER_CORRECT,
      });
    }
  });
}
