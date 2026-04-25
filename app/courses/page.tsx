import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/db/queries/dashboard";
import { getAllCoursesData } from "@/db/queries/courses";
import { getStreakDisplayData } from "@/db/queries/streak";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Navbar } from "@/components/navbar";
import { CourseCard } from "@/components/courses/course-card";
import { pickCardImage } from "@/lib/card-images";

export default async function CoursesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureProfile(user.id);

  const [coursesList, streak, profile] = await Promise.all([
    getAllCoursesData(user.id),
    getStreakDisplayData(user.id),
    db.query.profiles.findFirst({ where: eq(profiles.id, user.id) }),
  ]);

  const accountName =
    profile?.displayName ?? user.email?.split("@")[0] ?? "Account";

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 bg-neutral-50">
        <Navbar
          activeTab="courses"
          currentStreak={streak.currentStreak}
          dailyXpEarned={streak.dailyXpEarned}
          dailyXpGoal={streak.dailyXpGoal}
          accountName={accountName}
        />
      </div>

      <div className="mx-auto w-[1050px] pt-[100px] pb-32">
        <h1 className="font-heading text-2xl text-neutral-800 select-none">
          All Courses
        </h1>

        <div className="mt-32 flex flex-col gap-16">
          {coursesList.map((c) => (
            <CourseCard
              key={c.id}
              state={c.state}
              title={c.title}
              description={c.description}
              progressPercent={c.progressPercent}
              completedTopics={c.completedTopics}
              totalTopics={c.totalTopics}
              href={`/dashboard?course=${c.slug}`}
              bgImage={pickCardImage(c.id)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
