"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Option = { text: string; correct: boolean };

export function MultipleChoice({
  options,
  onAnswer,
  answered,
  reveal,
}: {
  options: Option[];
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  reveal?: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(() => {
    if (reveal) {
      const idx = options.findIndex((o) => o.correct);
      return idx >= 0 ? idx : null;
    }
    return null;
  });

  function handleCheck() {
    if (answered || selected === null) return;
    onAnswer(options[selected].correct);
  }

  return (
    <div className="flex flex-col gap-16">
      <ul className="flex flex-col gap-12">
        {options.map((opt, i) => {
          const isSelected = selected === i;
          let highlight = "";
          if (answered && isSelected) {
            highlight = opt.correct ? "highlight-true" : "highlight-false";
          } else if (answered && opt.correct) {
            highlight = "highlight-true";
          }

          return (
            <li key={i}>
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => !answered && setSelected(i)}
                disabled={answered}
                className={`group flex w-full items-center gap-12 text-left text-lg leading-[1.4] text-neutral-800 ${
                  answered ? "cursor-default" : "cursor-pointer"
                }`}
              >
                <span
                  aria-hidden
                  className={`flex size-[18px] shrink-0 items-center justify-center rounded-full border border-solid transition-colors ${
                    isSelected
                      ? "border-primary-400"
                      : answered
                        ? "border-neutral-400"
                        : "border-neutral-400 group-hover:border-neutral-800"
                  }`}
                >
                  {isSelected && (
                    <span className="size-[10px] rounded-full bg-primary-400" />
                  )}
                </span>
                <span className={highlight}>{opt.text}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {!answered && (
        <Button
          variant="secondary"
          onClick={handleCheck}
          disabled={selected === null}
          className="self-start"
        >
          Check Answer
        </Button>
      )}
    </div>
  );
}
