"use client";

import { useState, useMemo } from "react";
import { X } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function Order({
  sequence,
  onAnswer,
  answered,
}: {
  sequence: string[];
  onAnswer: (correct: boolean) => void;
  answered: boolean;
}) {
  const shuffled = useMemo(() => shuffle(sequence), [sequence]);
  const [selected, setSelected] = useState<string[]>([]);

  const remaining = shuffled.filter((item) => !selected.includes(item));

  function handleAdd(item: string) {
    if (answered) return;
    setSelected((prev) => [...prev, item]);
  }

  function handleRemove(index: number) {
    if (answered) return;
    setSelected((prev) => prev.filter((_, i) => i !== index));
  }

  function handleCheck() {
    if (answered || selected.length !== sequence.length) return;
    const isCorrect = selected.every((item, i) => item === sequence[i]);
    onAnswer(isCorrect);
  }

  return (
    <div className="flex flex-col gap-16">
      <div className="flex flex-col gap-8">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
          Your order
        </p>
        {selected.length === 0 ? (
          <p className="text-base italic leading-[1.4] text-neutral-400">
            Click items below to build your sequence
          </p>
        ) : (
          <ol className="flex flex-col gap-8">
            {selected.map((item, i) => {
              const isCorrect = answered && item === sequence[i];
              const isWrong = answered && item !== sequence[i];
              return (
                <li
                  key={i}
                  className="flex items-center gap-12 rounded-sm border border-solid border-black/10 bg-neutral-50 px-12 py-8 text-base leading-[1.4] text-neutral-800"
                >
                  <span className="w-16 text-right text-neutral-400">
                    {i + 1}.
                  </span>
                  <div className="flex-1">
                    <span
                      className={
                        isCorrect
                          ? "highlight-true"
                          : isWrong
                            ? "highlight-false"
                            : ""
                      }
                    >
                      {item}
                    </span>
                  </div>
                  {!answered && (
                    <button
                      type="button"
                      onClick={() => handleRemove(i)}
                      aria-label={`Remove ${item}`}
                      className="cursor-pointer text-neutral-400 hover:text-neutral-800"
                    >
                      <X size={16} />
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {remaining.length > 0 && !answered && (
        <div className="flex flex-col gap-8">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Available items
          </p>
          <ul className="flex flex-col gap-8">
            {remaining.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => handleAdd(item)}
                  className="w-full cursor-pointer rounded-sm border border-dashed border-neutral-300 bg-neutral-50 px-12 py-8 text-left text-base leading-[1.4] text-neutral-800 hover:bg-neutral-100"
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {answered && (
        <div className="flex flex-col gap-8">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Correct order
          </p>
          <ol className="flex flex-col gap-8">
            {sequence.map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-12 rounded-sm border border-solid border-black/10 bg-neutral-50 px-12 py-8 text-base leading-[1.4] text-neutral-800"
              >
                <span className="w-16 text-right text-neutral-400">
                  {i + 1}.
                </span>
                <span className="highlight-true">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {!answered && (
        <Button
          variant="secondary"
          onClick={handleCheck}
          disabled={selected.length !== sequence.length}
          className="self-start"
        >
          Check Answer
        </Button>
      )}
    </div>
  );
}
