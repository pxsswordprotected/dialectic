import Link from "next/link";
import { CARD_INNER_STROKE } from "@/components/dashboard/card-styles";
import { buttonClasses } from "@/components/ui/button";

type Props = {
  state: "not_started" | "in_progress" | "completed";
  title: string;
  description: string | null;
  progressPercent: number;
  completedTopics: number;
  totalTopics: number;
  href: string;
  bgImage?: string;
};

export function CourseCard({
  state,
  title,
  description,
  progressPercent,
  completedTopics,
  totalTopics,
  href,
  bgImage,
}: Props) {
  const buttonLabel =
    state === "not_started"
      ? "Start"
      : state === "in_progress"
        ? "Continue"
        : "View";

  const buttonVariant = state === "completed" ? "secondary" : "primary";

  return (
    <Link
      href={href}
      className={`${CARD_INNER_STROKE} group relative block h-[164px] w-[1050px] select-none overflow-hidden bg-white`}
    >
      {bgImage && (
        <>
          <img
            src={bgImage}
            alt=""
            aria-hidden
            className="absolute inset-0 size-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white from-50% to-transparent" />
        </>
      )}
      {!bgImage && (
        <div className="absolute inset-0 transition-colors group-hover:bg-neutral-100" />
      )}
      <div className="relative flex h-full items-center justify-between p-24">
        <div className="flex min-w-0 flex-col gap-8">
          <span className="font-heading text-xl text-neutral-800">
            {title}
          </span>
          {description && (
            <span className="truncate font-sans text-base text-neutral-500">
              {description}
            </span>
          )}
          <span className="font-sans text-base text-neutral-800">
            {progressPercent}% Complete · {completedTopics}/{totalTopics} topics
          </span>
        </div>
        <span className={buttonClasses(buttonVariant)}>{buttonLabel}</span>
      </div>
    </Link>
  );
}
