import Link from "next/link";
import { CARD_INNER_STROKE } from "./card-styles";

type Props = {
  mode: "continue" | "start";
  title: string;
  progressPercent: number;
  href: string;
};

export function ContinueLearningCard({
  mode,
  title,
  progressPercent,
  href,
}: Props) {
  return (
    <div className="flex flex-col gap-16">
      <span className="font-sans text-base text-neutral-400">
        {mode === "continue" ? "Continue learning" : "Start learning"}
      </span>
      <Link
        href={href}
        className={`${CARD_INNER_STROKE} bg-white w-[517px] h-[164px] p-16 flex flex-col justify-center transition-colors hover:bg-neutral-100`}
      >
        <span className="font-heading text-xl text-neutral-800">{title}</span>
        <span className="font-sans text-base text-neutral-800 mt-12">
          {progressPercent}% Complete
        </span>
      </Link>
    </div>
  );
}
