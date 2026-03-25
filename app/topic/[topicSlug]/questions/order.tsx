"use client";

import { useState, useMemo } from "react";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function Order({
  prompt,
  sequence,
  onAnswer,
  answered,
}: {
  prompt: string;
  sequence: string[];
  onAnswer: (correct: boolean) => void;
  answered: boolean;
}) {
  const shuffled = useMemo(() => shuffle(sequence), [sequence]);
  const [selected, setSelected] = useState<string[]>([]);
  const [correct, setCorrect] = useState(false);

  const remaining = shuffled.filter((item) => !selected.includes(item));

  function handleAdd(item: string) {
    if (answered) return;
    setSelected((prev) => [...prev, item]);
  }

  function handleRemove(index: number) {
    if (answered) return;
    setSelected((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    if (answered || selected.length !== sequence.length) return;
    const isCorrect = selected.every((item, i) => item === sequence[i]);
    setCorrect(isCorrect);
    onAnswer(isCorrect);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">{prompt}</p>

      {/* Selected sequence */}
      <div className="space-y-1">
        <p className="text-xs text-zinc-400 uppercase tracking-wider">
          Your order
        </p>
        {selected.length === 0 ? (
          <p className="text-sm text-zinc-400 italic">
            Click items below to build your sequence
          </p>
        ) : (
          <ol className="space-y-1">
            {selected.map((item, i) => (
              <li
                key={i}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                  answered
                    ? item === sequence[i]
                      ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                      : "border-red-500 bg-red-50 dark:bg-red-950/30"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <span className="text-zinc-400 w-5 text-right">{i + 1}.</span>
                <span className="flex-1">{item}</span>
                {!answered && (
                  <button
                    onClick={() => handleRemove(i)}
                    className="text-zinc-400 hover:text-zinc-600 text-xs"
                  >
                    &times;
                  </button>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Remaining items */}
      {remaining.length > 0 && !answered && (
        <div className="space-y-1">
          <p className="text-xs text-zinc-400 uppercase tracking-wider">
            Available items
          </p>
          <div className="space-y-1">
            {remaining.map((item) => (
              <button
                key={item}
                onClick={() => handleAdd(item)}
                className="w-full text-left rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      {!answered && (
        <button
          onClick={handleSubmit}
          disabled={selected.length !== sequence.length}
          className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
        >
          Check Order
        </button>
      )}

      {answered && !correct && (
        <div className="space-y-1">
          <p className="text-xs text-zinc-400 uppercase tracking-wider">
            Correct order
          </p>
          <ol className="space-y-1">
            {sequence.map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-2 rounded-md border border-green-500 px-3 py-2 text-sm"
              >
                <span className="text-zinc-400 w-5 text-right">{i + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
