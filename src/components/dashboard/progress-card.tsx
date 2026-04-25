import { CARD_INNER_STROKE } from "./card-styles";

type Props = {
  xpEarned: number;
  xpTotal: number;
  lessonsCompleted: number;
  lessonsTotal: number;
};

function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div className="relative h-16 w-[475px] rounded-[2px] bg-primary-200">
      <div
        className="absolute inset-y-0 left-0 rounded-[2px] bg-primary-400"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Row({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  return (
    <div className="flex w-[475px] flex-col gap-12">
      <div className="flex items-center justify-between text-base text-neutral-800 font-sans">
        <span>{label}</span>
        <span>
          {value}/{total}
        </span>
      </div>
      <ProgressBar value={value} total={total} />
    </div>
  );
}

export function ProgressCard({
  xpEarned,
  xpTotal,
  lessonsCompleted,
  lessonsTotal,
}: Props) {
  return (
    <div className="flex flex-col gap-16 select-none">
      <span className="font-sans text-base text-neutral-400">Progress</span>
      <div
        className={`${CARD_INNER_STROKE} bg-white w-[517px] h-[164px] p-16 flex flex-col gap-24 items-center justify-center`}
      >
        <Row label="Total XP Earned" value={xpEarned} total={xpTotal} />
        <Row
          label="Lessons Completed"
          value={lessonsCompleted}
          total={lessonsTotal}
        />
      </div>
    </div>
  );
}
