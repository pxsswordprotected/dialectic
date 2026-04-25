import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { practiceSessions } from "@/db/schema";

export type InProgressPracticeSession = {
  id: string;
  questions: string[];
  answers: Record<string, boolean>;
  currentIndex: number;
};

export async function getInProgressPracticeSession(
  userId: string,
  topicId: string,
): Promise<InProgressPracticeSession | null> {
  const [row] = await db
    .select({
      id: practiceSessions.id,
      questions: practiceSessions.questions,
      answers: practiceSessions.answers,
      currentIndex: practiceSessions.currentIndex,
    })
    .from(practiceSessions)
    .where(
      and(
        eq(practiceSessions.userId, userId),
        eq(practiceSessions.topicId, topicId),
        eq(practiceSessions.status, "in_progress"),
      ),
    )
    .limit(1);

  return row ?? null;
}
