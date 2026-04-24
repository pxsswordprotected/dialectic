import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDueReviewQuestions } from "@/db/queries/review";
import {
  ensureProfile,
  getDashboardData,
  computeTopicStatuses,
} from "@/db/queries/dashboard";
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
  const [reviewData, dashboard] = await Promise.all([
    getDueReviewQuestions(user.id),
    getDashboardData(user.id),
  ]);

  if (!reviewData) {
    redirect("/dashboard");
  }

  const { topicsWithStatus, completedCount } = computeTopicStatuses(
    dashboard.topics,
    dashboard.progressRows,
    dashboard.prerequisites,
  );

  const topicCount = reviewData.dueTopics.length;

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 bg-neutral-50">
        <Navbar
          mode="lesson"
          lessonTitle={`Reviewing ${topicCount} ${topicCount === 1 ? "topic" : "topics"}`}
          backHref="/dashboard"
          xp={dashboard.totalXp}
          starsEarned={completedCount}
          starsTotal={topicsWithStatus.length}
        />
      </div>
      <div className="w-full pt-[100px] pb-48">
        <ReviewContainer
          questions={reviewData.questions}
          dueTopics={reviewData.dueTopics}
        />
      </div>
    </>
  );
}
