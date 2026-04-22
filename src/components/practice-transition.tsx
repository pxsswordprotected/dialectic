"use client";

import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { SlideCounter } from "@/components/slide-counter";

type PracticeTransitionProps = {
  questionCount: number;
  onStart?: () => void;
};

export function PracticeTransition({
  questionCount,
  onStart,
}: PracticeTransitionProps) {
  const bars = Array.from({ length: questionCount }, () => "pending" as const);

  return (
    <div className="flex flex-col items-center">
      <SlideCounter bars={bars} showLeft={false} showRight={false} />

      <div className="mt-[36px] w-[700px] text-left">
        <h2 className="font-heading text-xl text-neutral-800">Practice</h2>

        <p className="mt-[28px] text-base leading-[1.4] text-neutral-800">
          {`${questionCount} questions on what you just learned. Don't worry about getting every one right.`}
        </p>

        <Button
          variant="primary"
          className="mt-[28px]"
          onClick={onStart}
          iconRight={<ArrowRight size={20} />}
        >
          Start Practice
        </Button>

        <div aria-hidden className="mt-[28px] h-px w-full bg-neutral-400" />
      </div>
    </div>
  );
}
