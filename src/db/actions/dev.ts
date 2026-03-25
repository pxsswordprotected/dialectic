"use server";

import { createClient } from "@/lib/supabase/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  profiles,
  userProgress,
  xpLog,
  reviewSchedule,
  practiceQuestionProgress,
} from "@/db/schema";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function devMarkTopicCompleted(topicId: string) {
  const user = await getUser();

  await db
    .insert(userProgress)
    .values({
      userId: user.id,
      topicId,
      status: "completed",
      completedAt: new Date(),
    })
    .onConflictDoNothing();

  await db.insert(xpLog).values({
    userId: user.id,
    topicId,
    activityType: "topic_completed",
    xpAmount: 25,
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  await db
    .insert(reviewSchedule)
    .values({ userId: user.id, topicId, nextReviewAt: tomorrow })
    .onConflictDoNothing();
}

export async function devResetTopicProgress(topicId: string) {
  const user = await getUser();

  await db
    .delete(userProgress)
    .where(
      sql`${userProgress.userId} = ${user.id} AND ${userProgress.topicId} = ${topicId}`,
    );
  await db
    .delete(reviewSchedule)
    .where(
      sql`${reviewSchedule.userId} = ${user.id} AND ${reviewSchedule.topicId} = ${topicId}`,
    );
  await db
    .delete(xpLog)
    .where(
      sql`${xpLog.userId} = ${user.id} AND ${xpLog.topicId} = ${topicId}`,
    );
}

export async function devResetAllProgress() {
  const user = await getUser();

  await db.delete(practiceQuestionProgress).where(eq(practiceQuestionProgress.userId, user.id));
  await db.delete(xpLog).where(eq(xpLog.userId, user.id));
  await db.delete(reviewSchedule).where(eq(reviewSchedule.userId, user.id));
  await db.delete(userProgress).where(eq(userProgress.userId, user.id));
}

export async function devSetStreak(streak: number) {
  const user = await getUser();
  await db
    .update(profiles)
    .set({ currentStreak: streak })
    .where(eq(profiles.id, user.id));
}

export async function devAddXp(amount: number) {
  const user = await getUser();
  await db.insert(xpLog).values({
    userId: user.id,
    activityType: "streak_bonus",
    xpAmount: amount,
  });
}

export async function devShiftReviewDates(days: number) {
  const user = await getUser();
  await db
    .update(reviewSchedule)
    .set({
      nextReviewAt: sql`${reviewSchedule.nextReviewAt} + interval '1 day' * ${days}`,
    })
    .where(eq(reviewSchedule.userId, user.id));
}
