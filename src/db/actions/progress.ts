"use server";

import { sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { userProgress } from "@/db/schema";

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

