"use client";

import { useState } from "react";

type Option = { text: string; correct: boolean };

export function MultipleChoice({
  prompt,
  options,
  onAnswer,
  answered,
}: {
  prompt: string;
  options: Option[];
  onAnswer: (correct: boolean) => void;
  answered: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  function handleSelect(index: number) {
    if (answered) return;
    setSelected(index);
    onAnswer(options[index].correct);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">{prompt}</p>
      <div className="space-y-2">
        {options.map((opt, i) => {
          let style = "border-zinc-200 dark:border-zinc-800";
          if (answered && selected === i) {
            style = opt.correct
              ? "border-green-500 bg-green-50 dark:bg-green-950/30"
              : "border-red-500 bg-red-50 dark:bg-red-950/30";
          } else if (answered && opt.correct) {
            style = "border-green-500";
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={answered}
              className={`w-full text-left rounded-md border px-4 py-3 text-sm transition-colors ${style} ${
                !answered ? "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer" : ""
              }`}
            >
              {opt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
