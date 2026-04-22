import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ensureProfile,
  getDashboardData,
  computeTopicStatuses,
} from "@/db/queries/dashboard";
import { getStreakDisplayData } from "@/db/queries/streak";
import { StreakDisplay } from "@/components/streak-display";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "@phosphor-icons/react/dist/ssr";

const statusConfig = {
  completed: {
    dot: "bg-green-500",
    text: "text-green-600 dark:text-green-400",
    label: "Completed",
  },
  in_progress: {
    dot: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
    label: "In Progress",
  },
  available: {
    dot: "bg-yellow-500",
    text: "text-yellow-600 dark:text-yellow-400",
    label: "Available",
  },
  locked: {
    dot: "bg-zinc-400",
    text: "text-zinc-500 dark:text-zinc-500",
    label: "Locked",
  },
} as const;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureProfile(user.id);
  const [data, streakData] = await Promise.all([
    getDashboardData(user.id),
    getStreakDisplayData(user.id),
  ]);

  if (!data.course) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-500">
          Course not found. Run the seed script first.
        </p>
      </div>
    );
  }

  const { topicsWithStatus, continueTopic, completedCount } =
    computeTopicStatuses(data.topics, data.progressRows, data.prerequisites);

  const totalTopics = topicsWithStatus.length;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 space-y-8">
      <StreakDisplay
        currentStreak={streakData.currentStreak}
        dailyXpEarned={streakData.dailyXpEarned}
        dailyXpGoal={streakData.dailyXpGoal}
      />

      {/* Header */}
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {data.course.title}
        </h1>
        <span className="text-sm text-zinc-500">{user.email}</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500">Topics Completed</p>
          <p className="text-2xl font-semibold">
            {completedCount}
            <span className="text-base font-normal text-zinc-400">
              /{totalTopics}
            </span>
          </p>
        </div>
        <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500">Total XP</p>
          <p className="text-2xl font-semibold">{data.totalXp}</p>
        </div>
        <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500">Streak</p>
          <p className="text-2xl font-semibold">
            {data.profile?.currentStreak ?? 0}
            <span className="text-base font-normal text-zinc-400"> days</span>
          </p>
        </div>
      </div>

      <Button>Start</Button>
      <Button>Save changes</Button>

      <Button variant="secondary">Check answer</Button>
      <Button
        variant="secondary"
        iconRight={<ArrowRight size={20} weight="bold" />}
      >
        Next question
      </Button>
      <Button
        variant="secondary"
        iconLeft={<ArrowLeft size={20} weight="bold" />}
      >
        Review lesson
      </Button>
      
      {/* Review banner */}
      {data.dueReviewCount > 0 && (
        <div className="rounded-md border border-zinc-200 p-5 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              {data.dueReviewCount} topic{data.dueReviewCount === 1 ? "" : "s"}{" "}
              due for review
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Spaced repetition keeps knowledge fresh
            </p>
          </div>
          <Link
            href="/review"
            className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
          >
            Start Review
          </Link>
        </div>
      )}

      {/* Continue learning */}
      {continueTopic && (
        <div className="rounded-md border border-zinc-200 p-5 dark:border-zinc-800">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Continue Learning
          </p>
          <p className="mt-1 text-lg font-semibold">{continueTopic.title}</p>
          {continueTopic.description && (
            <p className="mt-1 text-sm text-zinc-500">
              {continueTopic.description}
            </p>
          )}
        </div>
      )}

      {/* Topic list */}
      <div className="space-y-1">
        <h2 className="mb-3 text-lg font-semibold">All Topics</h2>
        <ol className="space-y-1">
          {topicsWithStatus.map((topic, i) => {
            const cfg = statusConfig[topic.status];
            const isClickable = topic.status !== "locked";
            const inner = (
              <li
                key={topic.id}
                className={`flex items-center gap-3 rounded-md border border-zinc-200 px-4 py-3 dark:border-zinc-800${isClickable ? " hover:bg-zinc-50 dark:hover:bg-zinc-800/50" : ""}`}
              >
                <span className="text-sm text-zinc-400 w-6 text-right">
                  {i + 1}
                </span>
                <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                <span
                  className={`flex-1 text-sm font-medium ${topic.status === "locked" ? "text-zinc-400" : ""}`}
                >
                  {topic.title}
                </span>
                <span className={`text-xs ${cfg.text}`}>{cfg.label}</span>
              </li>
            );
            return isClickable ? (
              <Link key={topic.id} href={`/topic/${topic.slug}`}>
                {inner}
              </Link>
            ) : (
              inner
            );
          })}
        </ol>
      </div>
    </div>
  );
}
