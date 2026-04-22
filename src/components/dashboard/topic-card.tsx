type TopicCardVariant =
  | "review"
  | "completed"
  | "in_progress"
  | "locked"
  | "brand_new";

type BaseProps = {
  title: string;
  description?: string;
  href?: string;
};

export type TopicCardProps =
  | ({ variant: "review"; dueCount: number } & BaseProps)
  | ({ variant: "completed"; xpEarned?: number } & BaseProps)
  | ({ variant: "in_progress"; progress?: number } & BaseProps)
  | ({ variant: "locked" } & BaseProps)
  | ({ variant: "brand_new" } & BaseProps);

export function TopicCard(props: TopicCardProps) {
  // TODO: render per-variant layout
  return null;
}

export type { TopicCardVariant };
