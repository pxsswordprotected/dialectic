"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InlineMarkdown } from "@/components/inline-markdown";

export function TrueFalse({
  statement,
  answer,
  onAnswer,
  answered,
  reveal,
}: {
  statement: string;
  answer: boolean;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  reveal?: boolean;
}) {
  const [selected, setSelected] = useState<boolean | null>(() =>
    reveal ? answer : null,
  );

  function handleCheck() {
    if (answered || selected === null) return;
    onAnswer(selected === answer);
  }

  function highlightFor(value: boolean) {
    const isSelected = selected === value;
    if (answered && isSelected) {
      return value === answer ? "highlight-true" : "highlight-false";
    }
    if (answered && value === answer) {
      return "highlight-true";
    }
    return "";
  }

  return (
    <div className="flex flex-col gap-16">
      <blockquote className="border-l-2 border-neutral-300 pl-12 text-lg italic leading-[1.4] text-neutral-800">
        <InlineMarkdown text={statement} />
      </blockquote>
      <ul className="flex flex-col gap-12">
        {[true, false].map((value) => {
          const isSelected = selected === value;
          return (
            <li key={String(value)}>
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => !answered && setSelected(value)}
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
                <span className={highlightFor(value)}>
                  {value ? "True" : "False"}
                </span>
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
