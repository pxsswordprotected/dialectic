"use client";

import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Button } from "@/components/ui/button";
import { SlideCounter } from "@/components/slide-counter";
import type { BarState } from "@/components/slide-counter-helpers";

export type LessonSlideType =
  | "concept"
  | "example"
  | "rule"
  | "warning"
  | "summary";

export type LessonSlideData = {
  type: LessonSlideType;
  heading: string;
  body: string;
  examples: Array<{ text: string; valid: boolean }> | null;
  note: string | null;
};

const labelForType: Record<LessonSlideType, string> = {
  concept: "Concept",
  example: "Example",
  rule: "Rule",
  warning: "Warning",
  summary: "Summary",
};

function InlineMarkdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({ children }) => <>{children}</>,
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

type LessonSlideProps = {
  slide: LessonSlideData;
  bars: BarState[];
  showLeftChevron?: boolean;
  showRightChevron?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
};

export function LessonSlide({
  slide,
  bars,
  showLeftChevron,
  showRightChevron,
  onPrev,
  onNext,
}: LessonSlideProps) {
  return (
    <div className="flex flex-col items-center">
      <SlideCounter
        bars={bars}
        showLeft={showLeftChevron}
        showRight={showRightChevron}
        onPrev={onPrev}
        onNext={onNext}
      />

      <div className="mt-[36px] w-[700px] text-left">
        <div className="flex items-center gap-16">
          <h2 className="font-heading text-xl text-neutral-800">
            {slide.heading}
          </h2>
          <span
            aria-hidden
            className="size-[8px] shrink-0 rounded-full border border-neutral-400"
          />
          <span className="text-base text-neutral-400">
            {labelForType[slide.type]}
          </span>
        </div>

        <p className="mt-[28px] text-lg leading-[1.4] text-neutral-800">
          <InlineMarkdown text={slide.body} />
        </p>

        {slide.examples && slide.examples.length > 0 && (
          <div className="mt-[28px]">
            <p className="text-base font-medium text-neutral-800">Examples:</p>
            <ul className="mt-16 flex flex-col gap-12">
              {slide.examples.map((ex, i) => (
                <li key={i} className="text-lg leading-[1.4] text-neutral-800">
                  <span
                    className={ex.valid ? "highlight-true" : "highlight-false"}
                  >
                    {ex.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {slide.note && (
          <p className="mt-16 text-lg italic leading-[1.4] text-neutral-500">
            {slide.note}
          </p>
        )}

        <Button
          variant="secondary"
          className="mt-32"
          onClick={onNext}
          iconRight={<ArrowRight size={20} />}
        >
          Next
        </Button>

        <div aria-hidden className="mt-[36px] h-px w-full bg-neutral-400" />
      </div>
    </div>
  );
}
