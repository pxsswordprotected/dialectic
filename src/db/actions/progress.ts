"use server";

import { sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { userProgress, practiceQuestionProgress } from "@/db/schema";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export async function setSlideProgress(topicId: string, slideIndex: number) {
  const userId = await getUserId();

  await db
    .insert(userProgress)
    .values({
      userId,
      topicId,
      status: "in_progress",
      currentSlideIndex: slideIndex,
    })
    .onConflictDoUpdate({
      target: [userProgress.userId, userProgress.topicId],
      set: {
        status: sql`CASE WHEN ${userProgress.status} = 'completed' THEN ${userProgress.status} ELSE 'in_progress'::topic_status END`,
        currentSlideIndex: sql`CASE WHEN ${userProgress.status} = 'completed' THEN ${userProgress.currentSlideIndex} ELSE GREATEST(${userProgress.currentSlideIndex}, ${slideIndex}) END`,
        updatedAt: new Date(),
      },
    });
}

export async function recordPracticeAnswer(
  practiceQuestionId: string,
  isCorrect: boolean,
) {
  const userId = await getUserId();

  await db
    .insert(practiceQuestionProgress)
    .values({
      userId,
      practiceQuestionId,
      isCorrect,
      attempts: 1,
      lastAttemptAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        practiceQuestionProgress.userId,
        practiceQuestionProgress.practiceQuestionId,
      ],
      set: {
        isCorrect: sql`${practiceQuestionProgress.isCorrect} OR ${isCorrect}`,
        attempts: sql`${practiceQuestionProgress.attempts} + 1`,
        lastAttemptAt: new Date(),
        updatedAt: new Date(),
      },
    });
}
