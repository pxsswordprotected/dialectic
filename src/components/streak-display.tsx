"use client";

export function StreakDisplay({
  currentStreak,
  dailyXpEarned,
  dailyXpGoal,
}: {
  currentStreak: number;
  dailyXpEarned: number;
  dailyXpGoal: number;
}) {
  return (
    <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
      <span>
        Streak: <span className="font-medium text-zinc-700 dark:text-zinc-300">{currentStreak}</span>
      </span>
      <span className="text-zinc-300 dark:text-zinc-600">|</span>
      <span>
        XP:{" "}
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          {dailyXpEarned}/{dailyXpGoal}
        </span>
      </span>
    </div>
  );
}
