"use client";

import { Fragment, useState } from "react";
import { Button } from "@/components/ui/button";

type Blank = { acceptable_answers: string[] };

function isCorrect(value: string, blank: Blank) {
  const v = value.trim().toLowerCase();
  return blank.acceptable_answers.some((a) => a.trim().toLowerCase() === v);
}

export function FillIn({
  prompt,
  blanks,
  onAnswer,
  answered,
  reveal,
}: {
  prompt: string;
  blanks: Blank[];
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  reveal?: boolean;
}) {
  const segments = prompt.split(/_{3,}/g);
  const [values, setValues] = useState<string[]>(() =>
    reveal
      ? blanks.map((b) => b.acceptable_answers[0] ?? "")
      : Array.from({ length: blanks.length }, () => ""),
  );

  const allFilled = values.every((v) => v.trim().length > 0);
  const perBlankCorrect = values.map((v, i) => isCorrect(v, blanks[i]));

  function handleCheck() {
    if (answered || !allFilled) return;
    onAnswer(perBlankCorrect.every(Boolean));
  }

  function updateValue(i: number, next: string) {
    setValues((prev) => prev.map((v, idx) => (idx === i ? next : v)));
  }

  return (
    <div className="flex flex-col gap-16">
      <p className="text-lg leading-[1.4] text-neutral-800">
        {segments.map((seg, i) => {
          const blank = blanks[i];
          const value = values[i] ?? "";
          const first = blank?.acceptable_answers[0] ?? "";
          const size = Math.max(first.length, value.length, 4);
          return (
            <Fragment key={i}>
              {seg}
              {i < blanks.length &&
                (answered ? (
                  <span
                    className={
                      perBlankCorrect[i] ? "highlight-true" : "highlight-false"
                    }
                  >
                    {value}
                  </span>
                ) : (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateValue(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCheck();
                    }}
                    size={size}
                    aria-label={`Blank ${i + 1}`}
                    className="mx-2 inline-block border-0 border-b border-solid border-neutral-400 bg-transparent px-4 font-[inherit] text-neutral-800 outline-none focus:border-primary-400"
                  />
                ))}
            </Fragment>
          );
        })}
      </p>

      {answered && perBlankCorrect.some((c) => !c) && (
        <ul className="flex flex-col gap-4 text-lg leading-[1.4] text-neutral-500">
          {blanks.map((b, i) =>
            perBlankCorrect[i] ? null : (
              <li key={i}>
                Accepted for blank {i + 1}: {b.acceptable_answers[0]}
              </li>
            ),
          )}
        </ul>
      )}

      {!answered && (
        <Button
          variant="secondary"
          onClick={handleCheck}
          disabled={!allFilled}
          className="self-start"
        >
          Check Answer
        </Button>
      )}
    </div>
  );
}
