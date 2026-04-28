"use client";

import { useState } from "react";
import {
  LessonSlide,
  type LessonSlideData,
} from "@/components/lesson-slide";
import {
  PracticeSlide,
  type PracticeQuestionData,
} from "@/components/practice-slide";
import { lessonBars } from "@/components/slide-counter-helpers";

type Props = {
  kind: "lesson" | "practice";
  data: unknown[];
};

export function PreviewClient({ kind, data }: Props) {
  const [index, setIndex] = useState(0);

  if (data.length === 0) {
    return (
      <p className="text-base text-neutral-500">
        File is an empty array — nothing to preview.
      </p>
    );
  }

  const safeIndex = Math.min(index, data.length - 1);
  const bars = lessonBars(data.length, safeIndex);

  function prev() {
    setIndex((i) => Math.max(0, i - 1));
  }
  function next() {
    setIndex((i) => Math.min(data.length - 1, i + 1));
  }

  return (
    <div className="flex flex-col items-center gap-24">
      {kind === "lesson" ? (
        <LessonSlide
          key={safeIndex}
          slide={data[safeIndex] as LessonSlideData}
          bars={bars}
          showLeftChevron={safeIndex > 0}
          showRightChevron={safeIndex < data.length - 1}
          onPrev={prev}
          onNext={next}
        />
      ) : (
        <PracticeSlide
          key={safeIndex}
          question={data[safeIndex] as PracticeQuestionData}
          questionNumber={safeIndex + 1}
          bars={bars}
          onNext={next}
          nextLabel={
            safeIndex < data.length - 1 ? "Next Question" : "End of file"
          }
        />
      )}

      <div className="flex items-center gap-12 rounded-sm border border-neutral-300 bg-white px-16 py-8 text-xs">
        <button
          onClick={prev}
          disabled={safeIndex === 0}
          className="rounded-sm border border-neutral-300 px-12 py-4 hover:bg-neutral-100 disabled:opacity-40"
        >
          Prev
        </button>
        <span className="text-neutral-500">
          {safeIndex + 1} / {data.length}
        </span>
        <button
          onClick={next}
          disabled={safeIndex === data.length - 1}
          className="rounded-sm border border-neutral-300 px-12 py-4 hover:bg-neutral-100 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
