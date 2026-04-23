import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTopicWithSlides, getPastCorrectness } from "@/db/queries/topic";
import {
  ensureProfile,
  getDashboardData,
  computeTopicStatuses,
} from "@/db/queries/dashboard";
import { Navbar } from "@/components/navbar";
import { SlideViewer } from "./slide-viewer";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topicSlug: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { topicSlug } = await params;
  await ensureProfile(user.id);
  const [data, dashboard] = await Promise.all([
    getTopicWithSlides(topicSlug),
    getDashboardData(user.id),
  ]);

  if (!data) {
    notFound();
  }

  const { topicsWithStatus, completedCount } = computeTopicStatuses(
    dashboard.topics,
    dashboard.progressRows,
    dashboard.prerequisites,
  );
  const wasAlreadyCompleted =
    topicsWithStatus.find((t) => t.id === data.topic.id)?.status === "completed";
  const lessonsCompletedIfPass = wasAlreadyCompleted
    ? completedCount
    : completedCount + 1;

  const viewMode = wasAlreadyCompleted;
  const pastCorrectness = viewMode
    ? await getPastCorrectness(
        user.id,
        data.questions.map((q) => q.id),
      )
    : {};

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 bg-neutral-50">
        <Navbar
          mode="lesson"
          lessonTitle={data.topic.title}
          backHref="/dashboard"
          xp={dashboard.totalXp}
          starsEarned={completedCount}
          starsTotal={topicsWithStatus.length}
        />
      </div>
      <div className="w-full pt-[128px] pb-48">
        <SlideViewer
          topic={data.topic}
          slides={data.slides}
          questions={data.questions}
          lessonsCompletedIfPass={lessonsCompletedIfPass}
          totalTopics={topicsWithStatus.length}
          viewMode={viewMode}
          pastCorrectness={pastCorrectness}
        />
      </div>
    </>
  );
}
