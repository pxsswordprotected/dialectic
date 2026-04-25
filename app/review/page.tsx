import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateReviewSession } from "@/db/queries/review";
import {
  ensureProfile,
  getDashboardData,
  computeTopicStatuses,
} from "@/db/queries/dashboard";
import { getStreakDisplayData } from "@/db/queries/streak";
import { Navbar } from "@/components/navbar";
import { ReviewContainer } from "./review-container";

export default async function ReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureProfile(user.id);
  const [session, dashboard, streak] = await Promise.all([
    getOrCreateReviewSession(user.id),
    getDashboardData(user.id),
    getStreakDisplayData(user.id),
  ]);

  if (!session) {
    redirect("/dashboard");
  }

  const { topicsWithStatus, completedCount } = computeTopicStatuses(
    dashboard.topics,
    dashboard.progressRows,
    dashboard.prerequisites,
  );

  const topicCount = session.dueTopics.length;

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 bg-neutral-50">
        <Navbar
          mode="lesson"
          lessonTitle={`Reviewing ${topicCount} ${topicCount === 1 ? "topic" : "topics"}`}
          backHref="/dashboard"
          currentStreak={streak.currentStreak}
          dailyXpEarned={streak.dailyXpEarned}
          dailyXpGoal={streak.dailyXpGoal}
        />
      </div>
      <div className="w-full pt-[100px] pb-48">
        <ReviewContainer
          sessionId={session.sessionId}
          questions={session.questions}
          answers={session.answers}
          startIndex={session.currentIndex}
          dailyXpEarned={streak.dailyXpEarned}
          dailyXpGoal={streak.dailyXpGoal}
        />
      </div>
    </>
  );
}
