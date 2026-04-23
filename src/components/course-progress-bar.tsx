type Props = {
  mode: "fail" | "pass";
  coursePct: number;
  xpEarned: number;
};

export function CourseProgressBar({ mode, coursePct, xpEarned }: Props) {
  if (mode === "fail") {
    return (
      <div className="flex w-[700px] items-center gap-12">
        <div className="h-16 flex-1 rounded-[2px] bg-neutral-200" />
        <span className="whitespace-nowrap font-sans text-base text-neutral-800">
          No XP earned
        </span>
      </div>
    );
  }

  const pct = Math.max(0, Math.min(100, coursePct));
  const text = pct >= 100 ? "Course completed" : `+${xpEarned} XP earned`;

  return (
    <div className="flex w-[700px] items-center gap-12">
      <div className="relative h-16 flex-1 rounded-[2px] bg-primary-200">
        <div
          className="absolute inset-y-0 left-0 rounded-[2px] bg-primary-400"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="whitespace-nowrap font-sans text-base text-neutral-800">
        {text}
      </span>
    </div>
  );
}
