type Props = {
  lessonsCompleted: number;
  lessonsTotal: number;
};

export function ProgressPill({ lessonsCompleted, lessonsTotal }: Props) {
  const pct =
    lessonsTotal > 0 ? Math.round((lessonsCompleted / lessonsTotal) * 100) : 0;

  // Feather shrinks as we approach 0% or 100% so the pill fully fills/empties at the extremes
  const feather = Math.min(4, pct, 100 - pct);
  const start = pct - feather;
  const end = pct + feather;
  const background = `linear-gradient(to right, var(--color-primary-300) 0%, var(--color-primary-300) ${start}%, var(--color-primary-50) ${end}%, var(--color-primary-50) 100%)`;

  return (
    <span
      className="inline-flex items-center rounded-full px-16 py-[6px] font-sans text-xs text-neutral-500"
      style={{
        background,
        boxShadow: "inset 0 0 2.7px rgba(0, 0, 0, 0.5)",
      }}
    >
      {pct}% Complete
    </span>
  );
}
