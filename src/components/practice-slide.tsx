"use client";

import { useState } from "react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { SlideCounter } from "@/components/slide-counter";
import type { BarState } from "@/components/slide-counter-helpers";
import { MultipleChoice } from "@/app/topic/[topicSlug]/questions/multiple-choice";
import { TrueFalse } from "@/app/topic/[topicSlug]/questions/true-false";
import { FillIn } from "@/app/topic/[topicSlug]/questions/fill-in";
import { Order } from "@/app/topic/[topicSlug]/questions/order";

export type PracticeQuestionData =
  | {
      type: "multiple_choice";
      prompt: string;
      options: Array<{ text: string; correct: boolean }>;
      explanation: string;
    }
  | {
      type: "true_false";
      prompt: string;
      statement: string;
      answer: boolean;
      explanation: string;
    }
  | {
      type: "fill_in";
      prompt: string;
      blanks: Array<{ acceptable_answers: string[] }>;
      explanation: string;
    }
  | {
      type: "order";
      prompt: string;
      sequence: string[];
      explanation: string;
    };

type PracticeSlideProps = {
  question: PracticeQuestionData;
  questionNumber: number;
  bars: BarState[];
  onNext?: () => void;
  onAnswered?: (correct: boolean) => void;
};

export function PracticeSlide({
  question,
  questionNumber,
  bars,
  onNext,
  onAnswered,
}: PracticeSlideProps) {
  const [answered, setAnswered] = useState(false);

  function handleAnswer(correct: boolean) {
    setAnswered(true);
    onAnswered?.(correct);
  }

  return (
    <div className="flex flex-col items-center">
      <SlideCounter
        bars={bars}
        showLeft={false}
        rightDisabled={!answered}
        onNext={answered ? onNext : undefined}
      />

      <div className="mt-32 w-[700px] text-left">
        <h2 className="text-lg font-medium text-neutral-800">
          Question {questionNumber}
        </h2>

        {question.type !== "fill_in" && (
          <p className="mt-[28px] text-base leading-[1.4] text-neutral-800">
            {question.prompt}
          </p>
        )}

        <div className="mt-[28px]">
          {question.type === "multiple_choice" && (
            <MultipleChoice
              options={question.options}
              onAnswer={handleAnswer}
              answered={answered}
            />
          )}
          {question.type === "true_false" && (
            <TrueFalse
              statement={question.statement}
              answer={question.answer}
              onAnswer={handleAnswer}
              answered={answered}
            />
          )}
          {question.type === "fill_in" && (
            <FillIn
              prompt={question.prompt}
              blanks={question.blanks}
              onAnswer={handleAnswer}
              answered={answered}
            />
          )}
          {question.type === "order" && (
            <Order
              sequence={question.sequence}
              onAnswer={handleAnswer}
              answered={answered}
            />
          )}
        </div>

        {answered && (
          <p className="mt-20 text-base font-medium leading-[1.4] text-neutral-800">
            {question.explanation}
          </p>
        )}

        {answered && (
          <Button
            variant="secondary"
            className="mt-32"
            onClick={onNext}
            iconRight={<ArrowRight size={20} />}
          >
            Next Question
          </Button>
        )}

        <div aria-hidden className="mt-[36px] h-px w-full bg-neutral-400" />
      </div>
    </div>
  );
}
