import Link from "next/link";
import {
  Check,
  ExclamationMark,
  LockSimple,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

type BaseProps = {
  title: string;
  href?: string;
  totalXp: number;
};

export type TopicCardProps =
  | ({ variant: "review"; dueXp: number } & BaseProps)
  | ({ variant: "completed"; xpEarned: number } & BaseProps)
  | ({
      variant: "in_progress";
      xpEarned: number;
      progressPercent: number;
    } & BaseProps)
  | ({ variant: "brand_new" } & BaseProps)
  | ({ variant: "locked" } & BaseProps);

const shell =
  "flex w-[1050px] items-center rounded-sm border border-black/10 p-16";

export function TopicCard(props: TopicCardProps) {
  if (props.variant === "locked") {
    return (
      <div className={`${shell} bg-neutral-200`}>
        <div className="flex flex-1 items-center gap-12 text-neutral-600">
          <span className="font-heading">{props.title}</span>
          <span className="font-sans text-base">{props.totalXp} XP</span>
        </div>
        <LockSimple size={28} className="text-neutral-600" />
      </div>
    );
  }

  const leftIcon =
    props.variant === "review" ? (
      <ExclamationMark size={32} weight="bold" className="text-primary-400" />
    ) : props.variant === "completed" ? (
      <Check
        size={32}
        className="text-primary-400"
        style={{ strokeLinecap: "square" }}
      />
    ) : null;

  const subtitle =
    props.variant === "review" ? (
      <span>{props.dueXp} XP available</span>
    ) : props.variant === "completed" ? (
      <span>{props.xpEarned} XP earned</span>
    ) : props.variant === "in_progress" ? (
      <div className="flex items-center gap-20">
        <span>{props.progressPercent}% Complete</span>
        <span>
          {props.xpEarned}/{props.totalXp} XP earned
        </span>
      </div>
    ) : (
      <div className="flex items-center gap-20">
        <span>0% Complete</span>
        <span>0/{props.totalXp} XP earned</span>
      </div>
    );

  const button =
    props.variant === "review" ? (
      <Button variant="primary">Start review</Button>
    ) : props.variant === "completed" ? (
      <Button variant="secondary">View</Button>
    ) : props.variant === "in_progress" ? (
      <Button variant="primary">Continue learning</Button>
    ) : (
      <Button variant="primary">Start</Button>
    );

  const body = (
    <div className={`${shell} bg-white`}>
      {leftIcon && <div className="mr-20">{leftIcon}</div>}
      <div className="flex flex-col gap-8">
        <span className="font-heading text-neutral-800">{props.title}</span>
        <div className="font-sans text-base text-neutral-400">{subtitle}</div>
      </div>
      <div className="ml-auto">{button}</div>
    </div>
  );

  return props.href ? <Link href={props.href}>{body}</Link> : body;
}
