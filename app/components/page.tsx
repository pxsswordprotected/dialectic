import { Navbar } from "@/components/navbar";
import { StreakDisplay } from "@/components/streak-display";
import { SlideCounter } from "@/components/slide-counter";
import { lessonBars } from "@/components/slide-counter-helpers";
import { LessonSlide, type LessonSlideData } from "@/components/lesson-slide";
import {
  PracticeSlide,
  type PracticeQuestionData,
} from "@/components/practice-slide";
import { PracticeTransition } from "@/components/practice-transition";
import { CourseProgressBar } from "@/components/course-progress-bar";
import { TopicCard } from "@/components/dashboard/topic-card";
import { ContinueLearningCard } from "@/components/dashboard/continue-learning-card";
import { pickCardImage } from "@/lib/card-images";
import { ProgressCard } from "@/components/dashboard/progress-card";
import { ProgressPill } from "@/components/dashboard/progress-pill";
import lessonData from "@/db/seed-data/courses/intro-logic/nodes/01-identifying-propositions/lesson.json";
import practiceData from "@/db/seed-data/courses/intro-logic/nodes/01-identifying-propositions/practice.json";

export default function ComponentsPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1050px] flex-col items-center gap-100 px-4 py-16">
      <Navbar xp={4} starsEarned={35} starsTotal={50} />
      <Navbar
        mode="lesson"
        lessonTitle="Lesson 1: Identifying Propositions"
        xp={4}
        starsEarned={35}
        starsTotal={50}
      />
      <StreakDisplay currentStreak={5} dailyXpEarned={30} dailyXpGoal={50} />

      <TopicCard
        variant="review"
        title="Review"
        totalXp={0}
        dueXp={40}
      />
      <TopicCard
        variant="completed"
        title="Identifying Propositions"
        totalXp={50}
        xpEarned={50}
      />
      <TopicCard
        variant="in_progress"
        title="Understanding Truth Values"
        totalXp={60}
        xpEarned={24}
        progressPercent={40}
      />
      <TopicCard
        variant="brand_new"
        title="Logical Connectives"
        totalXp={75}
      />
      <TopicCard
        variant="locked"
        title="Truth Tables"
        totalXp={80}
      />

      <ContinueLearningCard
        mode="continue"
        title="Identifying Propositions"
        progressPercent={40}
        href="/topic/identifying-propositions"
        bgImage={pickCardImage("identifying-propositions")}
      />
      <ContinueLearningCard
        mode="start"
        title="Identifying Propositions"
        progressPercent={0}
        href="/topic/identifying-propositions"
        bgImage={pickCardImage("start-preview")}
      />

      <ProgressCard
        xpEarned={14}
        xpTotal={120}
        lessonsCompleted={1}
        lessonsTotal={32}
      />

      <ProgressPill lessonsCompleted={0} lessonsTotal={32} />
      <ProgressPill lessonsCompleted={1} lessonsTotal={32} />
      <ProgressPill lessonsCompleted={16} lessonsTotal={32} />
      <ProgressPill lessonsCompleted={32} lessonsTotal={32} />

      <SlideCounter bars={lessonBars(6, 2)} />
      <SlideCounter bars={lessonBars(3, 0)} showLeft={false} />
      <SlideCounter
        bars={["correct", "wrong", "correct", "correct", "pending", "pending"]}
      />

      {(lessonData as LessonSlideData[]).map((slide, i) => (
        <LessonSlide
          key={i}
          slide={slide}
          bars={lessonBars(lessonData.length, i)}
        />
      ))}

      <PracticeTransition questionCount={practiceData.length} />

      <CourseProgressBar mode="fail" coursePct={0} xpEarned={0} />
      <CourseProgressBar mode="pass" coursePct={40} xpEarned={25} />
      <CourseProgressBar mode="pass" coursePct={100} xpEarned={25} />

      {(practiceData as PracticeQuestionData[]).map((q, i) => (
        <PracticeSlide
          key={i}
          question={q}
          questionNumber={i + 1}
          bars={lessonBars(practiceData.length, i)}
        />
      ))}
    </div>
  );
}
