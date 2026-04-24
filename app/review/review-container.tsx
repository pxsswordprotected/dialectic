"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import {
  PracticeSlide,
  type PracticeQuestionData,
} from "@/components/practice-slide";
import { lessonBars } from "@/components/slide-counter-helpers";
import { buttonClasses } from "@/components/ui/button";
import { completeReviewSession } from "@/db/actions/review";

const XP_PER_CORRECT = 5;

type ReviewQuestion = {
  id: string;
  questionType: string;
  prompt: string;
  questionData: unknown;
  explanation: string | null;
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

function toPracticeQuestion(q: ReviewQuestion): PracticeQuestionData {
  const data = (q.questionData ?? {}) as Record<string, unknown>;
  const explanation = q.explanation ?? "";
  switch (q.questionType) {
    case "multiple_choice":
      return {
        type: "multiple_choice",
        prompt: q.prompt,
        options:
          (data.options as Array<{ text: string; correct: boolean }>) ?? [],
        explanation,
      };
    case "true_false":
      return {
        type: "true_false",
        prompt: q.prompt,
        statement: (data.statement as string) ?? "",
        answer: (data.answer as boolean) ?? false,
        explanation,
      };
    case "fill_in":
      return {
        type: "fill_in",
        prompt: q.prompt,
        blanks: (data.blanks as Array<{ acceptable_answers: string[] }>) ?? [],
        explanation,
      };
    case "order":
      return {
        type: "order",
        prompt: q.prompt,
        sequence: (data.sequence as string[]) ?? [],
        explanation,
      };
    default:
      throw new Error(`Unknown question type: ${q.questionType}`);
  }
}

export function ReviewContainer({
  questions,
}: {
  questions: ReviewQuestion[];
  dueTopics: DueTopic[];
}) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [topicScores, setTopicScores] = useState<TopicScore[] | null>(null);
  const resultsRef = useRef<Array<{ questionId: string; correct: boolean }>>(
    [],
  );
  const submittedRef = useRef(false);

  function finish() {
    if (submittedRef.current) return;
    submittedRef.current = true;

    const byTopic = new Map<
      string,
      { correct: number; total: number; title: string }
    >();

    for (const r of resultsRef.current) {
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
    const topicResults: Array<{
      topicId: string;
      correctCount: number;
      totalCount: number;
    }> = [];

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

  if (topicScores) {
    const totalCorrect = topicScores.reduce((s, t) => s + t.correctCount, 0);
    const totalQuestions = topicScores.reduce((s, t) => s + t.totalCount, 0);
    const totalXp = totalCorrect * XP_PER_CORRECT;

    return (
      <div className="flex flex-col items-center">
        <div className="w-[700px] text-left text-neutral-800">
          <h2 className="font-heading text-2xl">Review Complete</h2>
          <p className="mt-[28px] font-sans text-lg font-medium leading-[1.4]">
            Score: {totalCorrect}/{totalQuestions} correct
          </p>
          <p className="mt-8 text-lg leading-[1.4] text-neutral-500">
            +{totalXp} XP earned
          </p>

          <ul className="mt-[28px] flex flex-col gap-8">
            {topicScores.map((ts) => {
              const allCorrect = ts.correctCount === ts.totalCount;
              const allWrong = ts.correctCount === 0;
              const highlight = allCorrect
                ? "highlight-true"
                : allWrong
                  ? "highlight-false"
                  : "";
              return (
                <li
                  key={ts.topicId}
                  className="flex items-center justify-between text-lg leading-[1.4]"
                >
                  <span className={highlight}>{ts.topicTitle}</span>
                  <span className="text-neutral-500">
                    {ts.correctCount}/{ts.totalCount}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-[28px]">
            <Link href="/dashboard" className={buttonClasses("secondary")}>
              Continue
              <ArrowRight size={20} weight="bold" />
            </Link>
          </div>

          <div aria-hidden className="mt-[28px] h-px w-full bg-neutral-400" />
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center">
        <div className="w-[700px] text-left text-neutral-800">
          <Link
            href="/dashboard"
            className="text-base text-neutral-400 hover:text-neutral-800"
          >
            &larr; Back to dashboard
          </Link>
          <p className="mt-16 text-neutral-500">No questions available.</p>
        </div>
      </div>
    );
  }

  const question = questions[questionIndex];
  const isLast = questionIndex === questions.length - 1;

  return (
    <PracticeSlide
      key={question.id}
      question={toPracticeQuestion(question)}
      questionNumber={questionIndex + 1}
      bars={lessonBars(questions.length, questionIndex)}
      nextLabel={isLast ? "See Results" : undefined}
      onAnswered={(correct) => {
        resultsRef.current.push({ questionId: question.id, correct });
      }}
      onNext={() => {
        if (isLast) {
          finish();
        } else {
          setQuestionIndex((i) => i + 1);
        }
      }}
    />
  );
}
