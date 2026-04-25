"use client";

import { useState, useMemo } from "react";
import { X } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

type Item = { text: string; category: string };

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function Classify({
  categories,
  items,
  onAnswer,
  answered,
  reveal,
}: {
  categories: string[];
  items: Item[];
  onAnswer: (correct: boolean) => void;
  answered: boolean;
  reveal?: boolean;
}) {
  const shuffled = useMemo(() => shuffle(items), [items]);
  const [placement, setPlacement] = useState<Record<string, string | null>>(
    () => {
      const init: Record<string, string | null> = {};
      for (const it of items) {
        init[it.text] = reveal ? it.category : null;
      }
      return init;
    },
  );
  const [selected, setSelected] = useState<string | null>(null);

  const available = shuffled.filter((it) => placement[it.text] == null);
  const placedCount = items.length - available.length;

  function handleSelectAvailable(text: string) {
    if (answered) return;
    setSelected((prev) => (prev === text ? null : text));
  }

  function handlePlaceIntoCategory(category: string) {
    if (answered || !selected) return;
    setPlacement((prev) => ({ ...prev, [selected]: category }));
    setSelected(null);
  }

  function handleRemove(text: string) {
    if (answered) return;
    setPlacement((prev) => ({ ...prev, [text]: null }));
  }

  function handleCheck() {
    if (answered || placedCount !== items.length) return;
    const byText = new Map(items.map((it) => [it.text, it.category]));
    const correct = items.every((it) => placement[it.text] === byText.get(it.text));
    onAnswer(correct);
  }

  return (
    <div className="flex flex-col gap-16">
      {available.length > 0 && (
        <div className="flex flex-col gap-8">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Items to sort
          </p>
          <ul className="flex flex-col gap-8">
            {available.map((it) => {
              const isSelected = selected === it.text;
              return (
                <li key={it.text}>
                  <button
                    type="button"
                    onClick={() => handleSelectAvailable(it.text)}
                    className={`w-full cursor-pointer rounded-sm border border-dashed bg-neutral-50 px-12 py-8 text-left text-lg leading-[1.4] text-neutral-800 hover:bg-neutral-100 ${
                      isSelected
                        ? "border-primary-400"
                        : "border-neutral-300"
                    }`}
                  >
                    {it.text}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {categories.map((category) => {
        const placedItems = items.filter(
          (it) => placement[it.text] === category,
        );
        const isDropTarget = selected !== null && !answered;
        const byText = new Map(items.map((it) => [it.text, it.category]));
        return (
          <div key={category} className="flex flex-col gap-8">
            <button
              type="button"
              onClick={() => handlePlaceIntoCategory(category)}
              disabled={!isDropTarget}
              className={`flex flex-col gap-8 rounded-sm border border-solid p-12 text-left transition-colors ${
                isDropTarget
                  ? "cursor-pointer border-primary-400 bg-primary-100/30 hover:bg-primary-100/50"
                  : "cursor-default border-black/10 bg-transparent"
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                {category}
              </p>
              {placedItems.length === 0 ? (
                <p className="text-lg italic leading-[1.4] text-neutral-400">
                  {isDropTarget
                    ? "Click to place here"
                    : "No items yet"}
                </p>
              ) : (
                <ul className="flex flex-col gap-8">
                  {placedItems.map((it) => {
                    const isCorrect =
                      answered && byText.get(it.text) === category;
                    const isWrong =
                      answered && byText.get(it.text) !== category;
                    return (
                      <li
                        key={it.text}
                        className="flex items-center gap-12 rounded-sm border border-solid border-black/10 bg-neutral-50 px-12 py-8 text-lg leading-[1.4] text-neutral-800"
                      >
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
                            {it.text}
                          </span>
                        </div>
                        {!answered && (
                          <span
                            role="button"
                            tabIndex={0}
                            aria-label={`Remove ${it.text}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(it.text);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRemove(it.text);
                              }
                            }}
                            className="cursor-pointer text-neutral-400 hover:text-neutral-800"
                          >
                            <X size={16} />
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </button>
          </div>
        );
      })}

      {!answered && (
        <Button
          variant="secondary"
          onClick={handleCheck}
          disabled={placedCount !== items.length}
          className="self-start"
        >
          Check Answer
        </Button>
      )}
    </div>
  );
}
