"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  devMarkTopicCompleted,
  devResetTopicProgress,
  devResetAllProgress,
  devSetStreak,
  devAddXp,
  devShiftReviewDates,
} from "@/db/actions/dev";

type Topic = { id: string; title: string };

export function DevTools({ topics }: { topics: Topic[] }) {
  const [open, setOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(topics[0]?.id ?? "");
  const [streak, setStreak] = useState("0");
  const [xp, setXp] = useState("25");
  const [days, setDays] = useState("-1");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === "X") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (process.env.NODE_ENV !== "development") return null;
  if (!open) return null;

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  const btnClass =
    "rounded bg-zinc-700 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-600 disabled:opacity-40";
  const inputClass =
    "rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-xs text-white w-16";

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg border border-zinc-700 bg-zinc-900 text-white shadow-2xl text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-700 px-3 py-2">
        <span className="font-semibold text-sm">Dev Tools</span>
        <button
          onClick={() => setOpen(false)}
          className="text-zinc-400 hover:text-white"
        >
          &times;
        </button>
      </div>

      <div className="space-y-3 p-3">
        {pending && (
          <p className="text-yellow-400 text-xs">Working...</p>
        )}

        {/* Topic Progress */}
        <div className="space-y-1.5">
          <p className="text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
            Topic Progress
          </p>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-xs text-white"
          >
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          <div className="flex gap-1.5">
            <button
              className={btnClass}
              disabled={pending}
              onClick={() => run(() => devMarkTopicCompleted(selectedTopic))}
            >
              Mark Complete
            </button>
            <button
              className={btnClass}
              disabled={pending}
              onClick={() => run(() => devResetTopicProgress(selectedTopic))}
            >
              Reset Topic
            </button>
          </div>
        </div>

        {/* Bulk */}
        <div className="space-y-1.5">
          <p className="text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
            Bulk
          </p>
          <button
            className={`${btnClass} bg-red-900 hover:bg-red-800`}
            disabled={pending}
            onClick={() => run(() => devResetAllProgress())}
          >
            Reset All Progress
          </button>
        </div>

        {/* Streak */}
        <div className="space-y-1.5">
          <p className="text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
            Streak
          </p>
          <div className="flex gap-1.5 items-center">
            <input
              type="number"
              value={streak}
              onChange={(e) => setStreak(e.target.value)}
              className={inputClass}
            />
            <button
              className={btnClass}
              disabled={pending}
              onClick={() => run(() => devSetStreak(Number(streak)))}
            >
              Set Streak
            </button>
          </div>
        </div>

        {/* XP */}
        <div className="space-y-1.5">
          <p className="text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
            XP
          </p>
          <div className="flex gap-1.5 items-center">
            <input
              type="number"
              value={xp}
              onChange={(e) => setXp(e.target.value)}
              className={inputClass}
            />
            <button
              className={btnClass}
              disabled={pending}
              onClick={() => run(() => devAddXp(Number(xp)))}
            >
              Add XP
            </button>
          </div>
        </div>

        {/* Reviews */}
        <div className="space-y-1.5">
          <p className="text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
            Review Schedule
          </p>
          <div className="flex gap-1.5 items-center">
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className={inputClass}
            />
            <span className="text-zinc-500">days</span>
            <button
              className={btnClass}
              disabled={pending}
              onClick={() => run(() => devShiftReviewDates(Number(days)))}
            >
              Shift
            </button>
          </div>
          <p className="text-zinc-500 text-[10px]">Negative = make due sooner</p>
        </div>
      </div>
    </div>
  );
}
