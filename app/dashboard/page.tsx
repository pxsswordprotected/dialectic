import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ensureProfile,
  getDashboardData,
  computeTopicStatuses,
  computeContinueCard,
} from "@/db/queries/dashboard";
import { Navbar } from "@/components/navbar";
import { ContinueLearningCard } from "@/components/dashboard/continue-learning-card";
import { ProgressCard } from "@/components/dashboard/progress-card";
import { pickCardImage } from "@/lib/card-images";
import { ProgressPill } from "@/components/dashboard/progress-pill";
import {
  TopicCard,
  type TopicCardProps,
} from "@/components/dashboard/topic-card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureProfile(user.id);
  const data = await getDashboardData(user.id);

  if (!data.course) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-neutral-500">
          Course not found. Run the seed script first.
        </p>
      </div>
    );
  }

  const { topicsWithStatus, completedCount } = computeTopicStatuses(
    data.topics,
    data.progressRows,
    data.prerequisites,
  );

  const continueCard = computeContinueCard(
    topicsWithStatus,
    data.progressRows,
    data.slideCounts,
    data.questionCounts,
    data.correctAnswers,
  );

  const courseTotalXp = data.topics.reduce((sum, t) => sum + t.totalXp, 0);
  const totalTopics = topicsWithStatus.length;

  const progressByTopic = new Map<string, number>();
  for (const row of data.progressRows) {
    const totalSlides = data.slideCounts.get(row.topicId) ?? 0;
    const totalQuestions = data.questionCounts.get(row.topicId) ?? 0;
    const correct = data.correctAnswers.get(row.topicId) ?? 0;
    const denom = totalSlides + totalQuestions;
    const pct =
      denom === 0
        ? 0
        : Math.round(
            ((Math.min(row.currentSlideIndex, totalSlides) + correct) / denom) *
              100,
          );
    progressByTopic.set(row.topicId, pct);
  }

  const topicCardProps = (
    topic: (typeof topicsWithStatus)[number],
  ): TopicCardProps => {
    const href = `/topic/${topic.slug}`;
    switch (topic.status) {
      case "completed":
        return {
          variant: "completed",
          title: topic.title,
          totalXp: topic.totalXp,
          xpEarned: topic.totalXp,
          href,
        };
      case "in_progress": {
        const pct = progressByTopic.get(topic.id) ?? 0;
        return {
          variant: "in_progress",
          title: topic.title,
          totalXp: topic.totalXp,
          xpEarned: Math.round((topic.totalXp * pct) / 100),
          progressPercent: pct,
          href,
        };
      }
      case "available":
        return {
          variant: "brand_new",
          title: topic.title,
          totalXp: topic.totalXp,
          href,
        };
      case "locked":
        return {
          variant: "locked",
          title: topic.title,
          totalXp: topic.totalXp,
        };
    }
  };

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 bg-neutral-50">
        <Navbar
          activeTab="learn"
          xp={data.totalXp}
          starsEarned={completedCount}
          starsTotal={totalTopics}
        />
      </div>

      <div className="mx-auto w-[1050px] pt-[116px] pb-32">
        {/* Course title + progress pill */}
        <div className="flex items-center gap-24">
          <h1 className="font-heading text-2xl text-neutral-800">
            {data.course.title}
          </h1>
          <ProgressPill
            lessonsCompleted={completedCount}
            lessonsTotal={totalTopics}
          />
        </div>

        {/* Review card */}
        {data.dueReviewCount > 0 && (
          <div className="mt-32">
            <TopicCard
              variant="review"
              title="Review"
              totalXp={0}
              dueXp={data.dueReviewCount}
              href="/review"
            />
          </div>
        )}

        {/* Continue learning + Progress cards */}
        <div className="mt-32 flex gap-16">
          {continueCard && (
            <ContinueLearningCard
              mode={continueCard.mode}
              title={continueCard.topic.title}
              progressPercent={continueCard.progressPercent}
              href={`/topic/${continueCard.topic.slug}`}
              bgImage={pickCardImage(continueCard.topic.id)}
            />
          )}
          <ProgressCard
            xpEarned={data.totalXp}
            xpTotal={courseTotalXp}
            lessonsCompleted={completedCount}
            lessonsTotal={totalTopics}
          />
        </div>

        {/* Divider */}
        <div className="mt-32 h-px w-[1050px] bg-black/10" />

        {/* All Lessons */}
        <p className="mt-24 font-sans text-base text-neutral-400">
          All Lessons
        </p>
        <div className="mt-16 flex flex-col gap-24">
          {topicsWithStatus.map((topic) => (
            <TopicCard key={topic.id} {...topicCardProps(topic)} />
          ))}
        </div>
      </div>
    </>
  );
}
