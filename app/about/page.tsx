import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { ensureProfile } from "@/db/queries/dashboard";
import { getStreakDisplayData } from "@/db/queries/streak";
import { Navbar } from "@/components/navbar";

export default async function AboutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureProfile(user.id);
  const [profile, streak] = await Promise.all([
    db.query.profiles.findFirst({ where: eq(profiles.id, user.id) }),
    getStreakDisplayData(user.id),
  ]);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 bg-neutral-50">
        <Navbar
          activeTab="account"
          currentStreak={streak.currentStreak}
          dailyXpEarned={streak.dailyXpEarned}
          dailyXpGoal={streak.dailyXpGoal}
          accountName={
            profile?.displayName ?? user.email?.split("@")[0] ?? "Account"
          }
        />
      </div>

      <div className="mx-auto w-[700px] pt-[100px] pb-48">
        <section>
          <h1 className="font-heading text-2xl text-neutral-800">
            What is Dialectic?
          </h1>
          <p className="mt-16 font-sans text-lg leading-[1.4] text-neutral-800">
            Dialectic is a philosophy learning platform built on well-studied
            principles from the science of learning. It applies techniques like
            spaced repetition and mastery-based progression to philosophy, a
            domain where structured learning tools have historically been rare.
            By combining these principles with modern technology, Dialectic aims
            to make philosophy learning faster and more effective.
          </p>
        </section>

        <section className="mt-48">
          <h2 className="font-heading text-2xl text-neutral-800">
            How It Works
          </h2>
          <p className="mt-16 font-sans text-lg leading-[1.4] text-neutral-800">
            Dialectic is built on four core learning principles: spaced
            repetition, cognitive load management, knowledge graphs, and
            retrieval practice. Each course is structured as a knowledge graph
            of topics that depend on one another. You must master prerequisite
            topics before moving on to more advanced ones. Lessons are broken
            into small, focused slides, followed by practice questions that test
            recall with immediate feedback. Topics you&apos;ve completed come
            back for review at timed intervals to keep the knowledge permanent.
          </p>
        </section>

        <section className="mt-48">
          <h2 className="font-heading text-2xl text-neutral-800">Built By</h2>
          <p className="mt-16 font-sans text-lg leading-[1.4] text-neutral-800">
            James Alford. Dialectic was built under Dr. Xing Liu as an
            undergraduate independent study project in service of education and
            good software. You can view more of James&apos; work at{" "}
            <a
              href="https://work.psswordprotectd.com/"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-primary-400"
            >
              work.psswordprotectd.com
            </a>
            .
          </p>
        </section>
      </div>
    </>
  );
}
