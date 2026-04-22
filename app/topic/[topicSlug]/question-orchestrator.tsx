"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { MultipleChoice } from "./questions/multiple-choice";
import { TrueFalse } from "./questions/true-false";
import { FillIn } from "./questions/fill-in";
import { Order } from "./questions/order";

export type OrchestratorQuestion = {
  id: string;
  questionType: string;
  prompt: string;
  questionData: unknown;
  explanation: string | null;
  [key: string]: unknown;
};

export type QuestionResult = {
  questionId: string;
  prompt: string;
  correct: boolean;
};

export function QuestionOrchestrator({
  questions,
  headerTitle,
  onComplete,
}: {
  questions: OrchestratorQuestion[];
  headerTitle: string;
  onComplete: (results: QuestionResult[]) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const resultsRef = useRef<QuestionResult[]>([]);

  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  const handleAnswer = useCallback(
    (correct: boolean) => {
      setAnswered(true);
      setLastCorrect(correct);
      resultsRef.current.push({
        questionId: questions[currentIndex].id,
        prompt: questions[currentIndex].prompt,
        correct,
      });
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
        <p className="text-zinc-500">No questions available.</p>
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

      <h1 className="text-lg font-semibold text-zinc-500">{headerTitle}</h1>

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
            blanks={
              data.blanks as Array<{ acceptable_answers: string[] }>
            }
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
              onClick={() => onComplete(resultsRef.current)}
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
