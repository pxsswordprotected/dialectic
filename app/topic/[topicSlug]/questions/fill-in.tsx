"use client";

import { useState } from "react";

export function FillIn({
  prompt,
  acceptableAnswers,
  onAnswer,
  answered,
}: {
  prompt: string;
  acceptableAnswers: string[];
  onAnswer: (correct: boolean) => void;
  answered: boolean;
}) {
  const [value, setValue] = useState("");
  const [correct, setCorrect] = useState(false);

  function handleSubmit() {
    if (answered || !value.trim()) return;
    const isCorrect = acceptableAnswers.some(
      (a) => a.trim().toLowerCase() === value.trim().toLowerCase(),
    );
    setCorrect(isCorrect);
    onAnswer(isCorrect);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">{prompt}</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          disabled={answered}
          placeholder="Type your answer..."
          className={`flex-1 rounded-md border px-4 py-2 text-sm outline-none ${
            answered
              ? correct
                ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                : "border-red-500 bg-red-50 dark:bg-red-950/30"
              : "border-zinc-200 dark:border-zinc-800 focus:border-zinc-400"
          }`}
        />
        {!answered && (
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
          >
            Submit
          </button>
        )}
      </div>
      {answered && !correct && (
        <p className="text-sm text-zinc-500">
          Accepted answer: {acceptableAnswers[0]}
        </p>
      )}
    </div>
  );
}
