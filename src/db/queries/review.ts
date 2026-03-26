import { eq, lte, and, asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { reviewSchedule, topics, practiceQuestions } from "@/db/schema";

export async function getDueReviewQuestions(userId: string) {
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

  const allQuestions: Array<{
    id: string;
    questionType: string;
    prompt: string;
    questionData: unknown;
    explanation: string | null;
    difficulty: number;
    topicId: string;
    topicTitle: string;
  }> = [];

  for (const dt of dueTopics) {
    const questions = await db
      .select({
        id: practiceQuestions.id,
        questionType: practiceQuestions.questionType,
        prompt: practiceQuestions.prompt,
        questionData: practiceQuestions.questionData,
        explanation: practiceQuestions.explanation,
        difficulty: practiceQuestions.difficulty,
      })
      .from(practiceQuestions)
      .where(eq(practiceQuestions.topicId, dt.topicId))
      .orderBy(sql`random()`)
      .limit(4);

    for (const q of questions) {
      allQuestions.push({
        ...q,
        topicId: dt.topicId,
        topicTitle: dt.topicTitle,
      });
    }
  }

  // Shuffle to interleave topics
  for (let i = allQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
  }

  return {
    questions: allQuestions,
    dueTopics: dueTopics.map((dt) => ({
      id: dt.topicId,
      title: dt.topicTitle,
    })),
  };
}
