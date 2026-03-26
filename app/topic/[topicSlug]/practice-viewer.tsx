"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { logPracticeXp } from "@/db/actions/xp";
import {
  QuestionOrchestrator,
  type QuestionResult,
  type OrchestratorQuestion,
} from "./question-orchestrator";

const PASS_THRESHOLD = 3;

export function PracticeViewer({
  questions,
  topicId,
  topicTitle,
  onReviewLesson,
}: {
  questions: OrchestratorQuestion[];
  topicId: string;
  topicTitle: string;
  onReviewLesson: () => void;
}) {
  const [results, setResults] = useState<QuestionResult[] | null>(null);
  const xpLoggedRef = useRef(false);

  if (results) {
    const correctCount = results.filter((r) => r.correct).length;
    const passed = correctCount >= PASS_THRESHOLD;
    const xpEarned = correctCount * 5 + (passed ? 5 : 0);

    if (!xpLoggedRef.current) {
      xpLoggedRef.current = true;
      logPracticeXp(topicId, correctCount, passed);
    }

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">
          {passed ? "Lesson Complete" : "Not Quite"}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Score: {correctCount} / {results.length} correct
          <span className="block text-sm mt-1">
            +{xpEarned} XP earned
            {!passed &&
              ` \u2014 you need at least ${PASS_THRESHOLD} correct to pass.`}
          </span>
        </p>

        <ol className="space-y-2">
          {results.map((result, i) => (
            <li
              key={i}
              className={`rounded-md px-4 py-3 text-sm font-medium ${
                result.correct
                  ? "bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300"
                  : "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300"
              }`}
            >
              Question {i + 1}: {result.prompt}
            </li>
          ))}
        </ol>

        <div className="flex items-center justify-end">
          {passed ? (
            <Link
              href="/dashboard"
              className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
            >
              Continue
            </Link>
          ) : (
            <button
              onClick={onReviewLesson}
              className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
            >
              Review Lesson
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <QuestionOrchestrator
      questions={questions}
      headerTitle={topicTitle}
      onComplete={setResults}
    />
  );
}
