"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { logPracticeXp } from "@/db/actions/xp";
import { MultipleChoice } from "./questions/multiple-choice";
import { TrueFalse } from "./questions/true-false";
import { FillIn } from "./questions/fill-in";
import { Order } from "./questions/order";

type Question = {
  id: string;
  sortOrder: number;
  questionType: string;
  prompt: string;
  questionData: unknown;
  explanation: string | null;
  difficulty: number;
};

type Result = { prompt: string; correct: boolean };

const PASS_THRESHOLD = 3;

export function PracticeViewer({
  questions,
  topicId,
  topicTitle,
  onReviewLesson,
}: {
  questions: Question[];
  topicId: string;
  topicTitle: string;
  onReviewLesson: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const resultsRef = useRef<Result[]>([]);
  const xpLoggedRef = useRef(false);

  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  const handleAnswer = useCallback(
    (correct: boolean) => {
      setAnswered(true);
      setLastCorrect(correct);
      resultsRef.current.push({ prompt: questions[currentIndex].prompt, correct });
    },
    [questions, currentIndex],
  );

  function handleNext() {
    setAnswered(false);
    setLastCorrect(false);
    setCurrentIndex((i) => i + 1);
  }

  if (questions.length === 0) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          &larr; Back to dashboard
        </Link>
        <p className="text-zinc-500">No practice questions for this topic.</p>
      </div>
    );
  }

  if (showResults) {
    const results = resultsRef.current;
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
            {!passed && ` \u2014 you need at least ${PASS_THRESHOLD} correct to pass.`}
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

  const data = question.questionData as Record<string, unknown>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          &larr; Back to dashboard
        </Link>
        <span className="text-sm text-zinc-400">
          Question {currentIndex + 1} / {questions.length}
        </span>
      </div>

      <h1 className="text-lg font-semibold text-zinc-500">{topicTitle}</h1>

      {/* Question card */}
      <div className="rounded-md border border-zinc-200 p-6 dark:border-zinc-800 space-y-4">
        {question.questionType === "multiple_choice" && (
          <MultipleChoice
            key={question.id}
            prompt={question.prompt}
            options={data.options as Array<{ text: string; correct: boolean }>}
            onAnswer={handleAnswer}
            answered={answered}
          />
        )}

        {question.questionType === "true_false" && (
          <TrueFalse
            key={question.id}
            prompt={question.prompt}
            statement={data.statement as string}
            answer={data.answer as boolean}
            onAnswer={handleAnswer}
            answered={answered}
          />
        )}

        {question.questionType === "fill_in" && (
          <FillIn
            key={question.id}
            prompt={question.prompt}
            acceptableAnswers={data.acceptable_answers as string[]}
            onAnswer={handleAnswer}
            answered={answered}
          />
        )}

        {question.questionType === "order" && (
          <Order
            key={question.id}
            prompt={question.prompt}
            sequence={data.sequence as string[]}
            onAnswer={handleAnswer}
            answered={answered}
          />
        )}

        {/* Explanation */}
        {answered && question.explanation && (
          <div className="mt-4 border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">
              {lastCorrect ? "Correct!" : "Incorrect"}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {question.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-end">
        {answered &&
          (isLast ? (
            <button
              onClick={() => setShowResults(true)}
              className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
            >
              See Results
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
            >
              Next
            </button>
          ))}
      </div>
    </div>
  );
}
