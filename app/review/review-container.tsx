"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  QuestionOrchestrator,
  type QuestionResult,
  type OrchestratorQuestion,
} from "@/app/topic/[topicSlug]/question-orchestrator";
import { completeReviewSession } from "@/db/actions/review";

const XP_PER_CORRECT = 5;

type TaggedQuestion = OrchestratorQuestion & {
  topicId: string;
  topicTitle: string;
};

type DueTopic = {
  id: string;
  title: string;
};

type TopicScore = {
  topicId: string;
  topicTitle: string;
  correctCount: number;
  totalCount: number;
};

export function ReviewContainer({
  questions,
  dueTopics,
}: {
  questions: TaggedQuestion[];
  dueTopics: DueTopic[];
}) {
  const [topicScores, setTopicScores] = useState<TopicScore[] | null>(null);
  const submittedRef = useRef(false);

  if (topicScores) {
    const totalCorrect = topicScores.reduce((s, t) => s + t.correctCount, 0);
    const totalQuestions = topicScores.reduce((s, t) => s + t.totalCount, 0);
    const totalXp = totalCorrect * XP_PER_CORRECT;

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Review Complete</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Score: {totalCorrect} / {totalQuestions} correct
          <span className="block text-sm mt-1">+{totalXp} XP earned</span>
        </p>

        <div className="space-y-2">
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            Per Topic
          </h2>
          {topicScores.map((ts) => (
            <div
              key={ts.topicId}
              className="flex items-center justify-between rounded-md border border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              <span className="text-sm font-medium">{ts.topicTitle}</span>
              <span
                className={`text-sm font-medium ${
                  ts.correctCount === ts.totalCount
                    ? "text-green-600 dark:text-green-400"
                    : ts.correctCount === 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-yellow-600 dark:text-yellow-400"
                }`}
              >
                {ts.correctCount} / {ts.totalCount}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end">
          <Link
            href="/dashboard"
            className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
          >
            Continue
          </Link>
        </div>
      </div>
    );
  }

  function handleComplete(results: QuestionResult[]) {
    if (submittedRef.current) return;
    submittedRef.current = true;

    // Group results by topicId
    const byTopic = new Map<string, { correct: number; total: number; title: string }>();

    for (const r of results) {
      const q = questions.find((qq) => qq.id === r.questionId);
      if (!q) continue;

      const existing = byTopic.get(q.topicId) ?? {
        correct: 0,
        total: 0,
        title: q.topicTitle,
      };
      existing.total += 1;
      if (r.correct) existing.correct += 1;
      byTopic.set(q.topicId, existing);
    }

    const scores: TopicScore[] = [];
    const topicResults: Array<{ topicId: string; correctCount: number; totalCount: number }> = [];

    for (const [topicId, data] of byTopic) {
      scores.push({
        topicId,
        topicTitle: data.title,
        correctCount: data.correct,
        totalCount: data.total,
      });
      topicResults.push({
        topicId,
        correctCount: data.correct,
        totalCount: data.total,
      });
    }

    setTopicScores(scores);
    completeReviewSession(topicResults);
  }

  return (
    <QuestionOrchestrator
      questions={questions}
      headerTitle="Review"
      onComplete={handleComplete}
    />
  );
}
