"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import {
  PracticeSlide,
  type PracticeQuestionData,
} from "@/components/practice-slide";
import { CourseProgressBar } from "@/components/course-progress-bar";
import { lessonBars } from "@/components/slide-counter-helpers";
import { buttonClasses } from "@/components/ui/button";
import {
  saveReviewAnswer,
  completeReviewSession,
} from "@/db/actions/review";

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
    case "classify":
      return {
        type: "classify",
        prompt: q.prompt,
        categories: (data.categories as string[]) ?? [],
        items:
          (data.items as Array<{ text: string; category: string }>) ?? [],
        explanation,
      };
    default:
      throw new Error(`Unknown question type: ${q.questionType}`);
  }
}

export function ReviewContainer({
  sessionId,
  questions,
  answers,
  startIndex,
  dailyXpEarned,
  dailyXpGoal,
}: {
  sessionId: string;
  questions: ReviewQuestion[];
  answers: Record<string, boolean>;
  startIndex: number;
  dailyXpEarned: number;
  dailyXpGoal: number;
}) {
  const clampedStart = Math.min(startIndex, questions.length - 1);
  const [questionIndex, setQuestionIndex] = useState(clampedStart);
  const [topicScores, setTopicScores] = useState<TopicScore[] | null>(null);
  const answersRef = useRef<Record<string, boolean>>({ ...answers });
  const submittedRef = useRef(false);

  function buildScores(): TopicScore[] {
    const byTopic = new Map<
      string,
      { correct: number; total: number; title: string }
    >();

    for (const q of questions) {
      if (!(q.id in answersRef.current)) continue;
      const entry = byTopic.get(q.topicId) ?? {
        correct: 0,
        total: 0,
        title: q.topicTitle,
      };
      entry.total += 1;
      if (answersRef.current[q.id]) entry.correct += 1;
      byTopic.set(q.topicId, entry);
    }

    const scores: TopicScore[] = [];
    for (const [topicId, data] of byTopic) {
      scores.push({
        topicId,
        topicTitle: data.title,
        correctCount: data.correct,
        totalCount: data.total,
      });
    }
    return scores;
  }

  function finish() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setTopicScores(buildScores());
    completeReviewSession(sessionId);
  }

  if (topicScores) {
    const totalCorrect = topicScores.reduce((s, t) => s + t.correctCount, 0);
    const totalQuestions = topicScores.reduce((s, t) => s + t.totalCount, 0);
    const totalXp = totalCorrect * XP_PER_CORRECT;
    const dailyPct =
      dailyXpGoal > 0
        ? Math.round(((dailyXpEarned + totalXp) / dailyXpGoal) * 100)
        : 0;

    return (
      <div className="flex flex-col items-center">
        <CourseProgressBar
          mode={totalXp > 0 ? "pass" : "fail"}
          coursePct={dailyPct}
          xpEarned={totalXp}
          completeLabel="Daily goal reached"
        />
        <div className="mt-32 w-[700px] text-left text-neutral-800">
          <h2 className="font-heading text-2xl">Review Complete</h2>
          <p className="mt-[28px] font-sans text-lg font-medium leading-[1.4]">
            Score: {totalCorrect}/{totalQuestions} correct
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
  const existingAnswer = answersRef.current[question.id];
  const revealForResumed =
    existingAnswer === undefined
      ? undefined
      : existingAnswer
        ? "correct"
        : "incorrect";

  return (
    <PracticeSlide
      key={question.id}
      question={toPracticeQuestion(question)}
      questionNumber={questionIndex + 1}
      bars={lessonBars(questions.length, questionIndex)}
      nextLabel={isLast ? "See Results" : undefined}
      reveal={revealForResumed}
      onAnswered={(correct) => {
        if (question.id in answersRef.current) return;
        answersRef.current[question.id] = correct;
        saveReviewAnswer(sessionId, question.id, correct);
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
