"use client";

import { useState } from "react";

export function TrueFalse({
  prompt,
  statement,
  answer,
  onAnswer,
  answered,
}: {
  prompt: string;
  statement: string;
  answer: boolean;
  onAnswer: (correct: boolean) => void;
  answered: boolean;
}) {
  const [selected, setSelected] = useState<boolean | null>(null);

  function handleSelect(value: boolean) {
    if (answered) return;
    setSelected(value);
    onAnswer(value === answer);
  }

  function buttonStyle(value: boolean) {
    let style = "border-zinc-200 dark:border-zinc-800";
    if (answered && selected === value) {
      style =
        value === answer
          ? "border-green-500 bg-green-50 dark:bg-green-950/30"
          : "border-red-500 bg-red-50 dark:bg-red-950/30";
    } else if (answered && value === answer) {
      style = "border-green-500";
    }
    return style;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">{prompt}</p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 italic border-l-2 border-zinc-300 pl-3 dark:border-zinc-700">
        {statement}
      </p>
      <div className="flex gap-3">
        {[true, false].map((value) => (
          <button
            key={String(value)}
            onClick={() => handleSelect(value)}
            disabled={answered}
            className={`flex-1 rounded-md border px-4 py-3 text-sm font-medium transition-colors ${buttonStyle(value)} ${
              !answered ? "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer" : ""
            }`}
          >
            {value ? "True" : "False"}
          </button>
        ))}
      </div>
    </div>
  );
}
