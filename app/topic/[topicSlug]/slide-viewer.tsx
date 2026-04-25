"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { logPracticeXp } from "@/db/actions/xp";
import {
  setSlideProgress,
  recordPracticeAnswer,
} from "@/db/actions/progress";
import { LessonSlide, type LessonSlideData } from "@/components/lesson-slide";
import {
  PracticeSlide,
  type PracticeQuestionData,
} from "@/components/practice-slide";
import { PracticeTransition } from "@/components/practice-transition";
import { CourseProgressBar } from "@/components/course-progress-bar";
import { lessonBars } from "@/components/slide-counter-helpers";
import { Button, buttonClasses } from "@/components/ui/button";

type DbSlide = {
  id: string;
  sortOrder: number;
  slideType: string;
  heading: string | null;
  content: unknown;
};

type DbQuestion = {
  id: string;
  sortOrder: number;
  questionType: string;
  prompt: string;
  questionData: unknown;
  explanation: string | null;
  difficulty: number;
};

type Topic = {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  totalXp: number;
  sortOrder: number;
};

const PASS_THRESHOLD = 3;

function toLessonSlide(slide: DbSlide): LessonSlideData {
  const content = (slide.content ?? {}) as {
    body?: string;
    examples?: Array<{ text: string; valid: boolean }> | null;
    note?: string | null;
  };
  return {
    type: slide.slideType as LessonSlideData["type"],
    heading: slide.heading ?? "",
    body: content.body ?? "",
    examples: content.examples ?? null,
    note: content.note ?? null,
  };
}

function toPracticeQuestion(q: DbQuestion): PracticeQuestionData {
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
        items: (data.items as Array<{ text: string; category: string }>) ?? [],
        explanation,
      };
    default:
      throw new Error(`Unknown question type: ${q.questionType}`);
  }
}

export function SlideViewer({
  topic,
  slides,
  questions,
  lessonsCompletedIfPass,
  totalTopics,
  viewMode = false,
  pastCorrectness = {},
  initialSlideIndex = 0,
}: {
  topic: Topic;
  slides: DbSlide[];
  questions: DbQuestion[];
  lessonsCompletedIfPass: number;
  totalTopics: number;
  viewMode?: boolean;
  pastCorrectness?: Record<string, boolean>;
  initialSlideIndex?: number;
}) {
  const resumePastLessons =
    !viewMode && slides.length > 0 && initialSlideIndex >= slides.length;
  const initialLessonIndex =
    viewMode || resumePastLessons
      ? 0
      : Math.min(Math.max(initialSlideIndex, 0), Math.max(slides.length - 1, 0));
  const [phase, setPhase] = useState<
    "lesson" | "transition" | "practice" | "results"
  >(resumePastLessons ? "transition" : "lesson");
  const [slideIndex, setSlideIndex] = useState(initialLessonIndex);
  const [questionIndex, setQuestionIndex] = useState(0);
  const resultsRef = useRef<Array<{ prompt: string; correct: boolean }>>([]);
  const xpLoggedRef = useRef(false);
  const router = useRouter();

  if (slides.length === 0) {
    return (
      <div className="mx-auto w-[700px] space-y-4 py-8">
        <Link
          href="/dashboard"
          className="text-base text-neutral-400 hover:text-neutral-800"
        >
          &larr; Back to dashboard
        </Link>
        <h1 className="font-heading text-xl text-neutral-800">{topic.title}</h1>
        <p className="text-neutral-500">No slides available for this topic.</p>
      </div>
    );
  }

  if (phase === "lesson") {
    const slide = slides[slideIndex];
    const isLast = slideIndex === slides.length - 1;
    return (
      <>
        <LessonSlide
          slide={toLessonSlide(slide)}
          bars={lessonBars(slides.length, slideIndex)}
          showLeftChevron={slideIndex > 0}
          showRightChevron
          onPrev={
            slideIndex > 0 ? () => setSlideIndex((i) => i - 1) : undefined
          }
          onNext={() => {
            if (isLast) {
              if (!viewMode) {
                void setSlideProgress(topic.id, slides.length);
              }
              setPhase(viewMode ? "practice" : "transition");
            } else {
              const next = slideIndex + 1;
              if (!viewMode) void setSlideProgress(topic.id, next);
              setSlideIndex(next);
            }
          }}
        />
      </>
    );
  }

  if (phase === "transition") {
    return (
      <>
        <PracticeTransition
          questionCount={questions.length}
          onStart={() => setPhase("practice")}
        />
      </>
    );
  }

  if (phase === "practice") {
    const question = questions[questionIndex];
    const isLast = questionIndex === questions.length - 1;
    return (
      <>
        <PracticeSlide
          key={question.id}
          question={toPracticeQuestion(question)}
          questionNumber={questionIndex + 1}
          bars={lessonBars(questions.length, questionIndex)}
          reveal={
            viewMode
              ? pastCorrectness[question.id] === false
                ? "incorrect"
                : "correct"
              : undefined
          }
          nextLabel={viewMode && isLast ? "Continue" : undefined}
          onAnswered={(correct) => {
            resultsRef.current.push({ prompt: question.prompt, correct });
            if (!viewMode) void recordPracticeAnswer(question.id, correct);
          }}
          onNext={() => {
            if (viewMode && isLast) {
              router.push("/dashboard");
            } else if (isLast) {
              setPhase("results");
            } else {
              const next = questionIndex + 1;
              if (!viewMode) {
                void setSlideProgress(topic.id, slides.length + next);
              }
              setQuestionIndex(next);
            }
          }}
        />
      </>
    );
  }

  // Results
  const results = viewMode
    ? questions.map((q) => ({
        prompt: q.prompt,
        correct: pastCorrectness[q.id] ?? true,
      }))
    : resultsRef.current;
  const correctCount = results.filter((r) => r.correct).length;
  const passed = viewMode ? true : correctCount >= PASS_THRESHOLD;
  const xpEarned = viewMode ? 0 : correctCount * 5 + (passed ? 5 : 0);
  const coursePct =
    totalTopics > 0
      ? Math.round((lessonsCompletedIfPass / totalTopics) * 100)
      : 0;

  if (!viewMode && !xpLoggedRef.current) {
    xpLoggedRef.current = true;
    logPracticeXp(topic.id, correctCount, passed);
  }

  return (
    <div className="flex flex-col items-center">
      <CourseProgressBar
        mode={passed ? "pass" : "fail"}
        coursePct={coursePct}
        xpEarned={xpEarned}
      />
      <div className="mt-32 w-[700px] text-left text-neutral-800">
        <h2 className="font-heading text-2xl">
          {passed ? "Lesson Complete" : "Not Quite"}
        </h2>
        <p className="mt-[28px] font-sans text-lg font-medium leading-[1.4]">
          Score: {correctCount}/{results.length} correct
        </p>
        <ul className="mt-[28px] flex flex-col gap-8">
          {results.map((r, i) => (
            <li
              key={i}
              className="flex items-center gap-8 text-lg leading-[1.4]"
            >
              {r.correct ? (
                <Check
                  size={20}
                  className="shrink-0 text-highlight-true"
                  style={{ strokeLinecap: "square" }}
                />
              ) : (
                <X
                  size={24}
                  weight="bold"
                  className="shrink-0 text-highlight-false"
                  style={{ strokeLinecap: "square" }}
                />
              )}
              <span
                className={r.correct ? "highlight-true" : "highlight-false"}
              >
                Question {i + 1}: {r.prompt}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-[28px]">
          {passed ? (
            <Link href="/dashboard" className={buttonClasses("secondary")}>
              Continue
              <ArrowRight size={20} weight="bold" />
            </Link>
          ) : (
            <Button
              variant="secondary"
              iconLeft={<ArrowLeft size={20} weight="bold" />}
              onClick={() => {
                resultsRef.current = [];
                xpLoggedRef.current = false;
                setQuestionIndex(0);
                setSlideIndex(0);
                setPhase("lesson");
              }}
            >
              Review Lesson
            </Button>
          )}
        </div>
        <div aria-hidden className="mt-[28px] h-px w-full bg-neutral-400" />
      </div>
    </div>
  );
}
