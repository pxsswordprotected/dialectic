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
import { TopicCard } from "@/components/dashboard/topic-card";
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
