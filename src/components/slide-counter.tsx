"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import type { BarState } from "./slide-counter-helpers";

const barColor: Record<BarState, string> = {
  completed: "bg-primary-400",
  active: "bg-primary-200",
  pending: "bg-neutral-200",
  correct: "bg-bar-correct",
  wrong: "bg-bar-wrong",
};

type SlideCounterProps = {
  bars: BarState[];
  showLeft?: boolean;
  showRight?: boolean;
  leftDisabled?: boolean;
  rightDisabled?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
};

export function SlideCounter({
  bars,
  showLeft = true,
  showRight = true,
  leftDisabled = false,
  rightDisabled = false,
  onPrev,
  onNext,
}: SlideCounterProps) {
  const asymmetric = showLeft !== showRight;

  return (
    <div className="flex items-center gap-24">
      {showLeft ? (
        <button
          type="button"
          onClick={onPrev}
          disabled={leftDisabled}
          aria-label="Previous slide"
          className={
            leftDisabled
              ? "cursor-not-allowed text-neutral-300"
              : "cursor-pointer text-neutral-800"
          }
        >
          <CaretLeft size={24} />
        </button>
      ) : asymmetric ? (
        <span aria-hidden className="size-[24px] shrink-0" />
      ) : null}
      <div className="flex h-[16px] w-[700px] items-stretch gap-[4px]">
        {bars.map((state, i) => (
          <span key={i} className={`flex-1 ${barColor[state]}`} />
        ))}
      </div>
      {showRight ? (
        <button
          type="button"
          onClick={onNext}
          disabled={rightDisabled}
          aria-label="Next slide"
          className={
            rightDisabled
              ? "cursor-not-allowed text-neutral-300"
              : "cursor-pointer text-neutral-800"
          }
        >
          <CaretRight size={24} />
        </button>
      ) : asymmetric ? (
        <span aria-hidden className="size-[24px] shrink-0" />
      ) : null}
    </div>
  );
}
