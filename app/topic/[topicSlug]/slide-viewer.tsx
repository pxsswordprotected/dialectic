"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

type SlideContent = {
  body: string;
  examples: Array<{ text: string; valid: boolean }> | null;
  note: string | null;
};

type Slide = {
  id: string;
  sortOrder: number;
  slideType: string;
  heading: string | null;
  content: unknown;
};

type Topic = {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  totalXp: number;
  sortOrder: number;
};

export function SlideViewer({
  topic,
  slides,
}: {
  topic: Topic;
  slides: Slide[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slide = slides[currentIndex];

  if (slides.length === 0) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          &larr; Back to dashboard
        </Link>
        <h1 className="text-2xl font-semibold">{topic.title}</h1>
        <p className="text-zinc-500">No slides available for this topic.</p>
      </div>
    );
  }

  const content = slide.content as SlideContent | null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          &larr; Back to dashboard
        </Link>
        <span className="text-sm text-zinc-400">
          {currentIndex + 1} / {slides.length}
        </span>
      </div>

      {/* Topic title */}
      <h1 className="text-lg font-semibold text-zinc-500">{topic.title}</h1>

      {/* Slide content */}
      <div className="rounded-md border border-zinc-200 p-6 dark:border-zinc-800 space-y-4">
        {slide.heading && (
          <h2 className="text-xl font-semibold">{slide.heading}</h2>
        )}

        {content?.body && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{content.body}</ReactMarkdown>
          </div>
        )}

        {content?.examples && content.examples.length > 0 && (
          <ul className="space-y-2 mt-4">
            {content.examples.map((ex, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm"
              >
                <span
                  className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                    ex.valid ? "bg-green-500" : "bg-red-400"
                  }`}
                />
                <span>{ex.text}</span>
              </li>
            ))}
          </ul>
        )}

        {content?.note && (
          <p className="text-sm text-zinc-500 italic border-l-2 border-zinc-300 pl-3 dark:border-zinc-700">
            {content.note}
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex((i) => i - 1)}
          disabled={currentIndex === 0}
          className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
        >
          Back
        </button>
        <button
          onClick={() => setCurrentIndex((i) => i + 1)}
          disabled={currentIndex === slides.length - 1}
          className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
