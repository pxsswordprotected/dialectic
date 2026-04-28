import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import {
  ensureProfile,
  getDashboardData,
} from "@/db/queries/dashboard";
import { getStreakDisplayData } from "@/db/queries/streak";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { signOut } from "@/db/actions/auth";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureProfile(user.id);
  const [profile, dashboard, streak] = await Promise.all([
    db.query.profiles.findFirst({ where: eq(profiles.id, user.id) }),
    getDashboardData(user.id),
    getStreakDisplayData(user.id),
  ]);

  async function updateProfile(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const raw = (formData.get("displayName") as string) ?? "";
    const displayName = raw.trim();
    const goalRaw = Number(formData.get("dailyXpGoal"));
    const dailyXpGoal = Math.max(
      20,
      Math.min(100, Math.round(goalRaw || 100)),
    );

    await db
      .update(profiles)
      .set({
        displayName: displayName.length ? displayName.slice(0, 255) : null,
        dailyXpGoal,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));

    redirect("/settings");
  }

  const displayName = profile?.displayName ?? "";
  const dailyXpGoal = profile?.dailyXpGoal ?? 100;
  const email = user.email ?? "";

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
        <h1 className="font-heading text-2xl text-neutral-800">Settings</h1>

        <form action={updateProfile}>
          <div className="mt-32 flex items-center justify-between">
            <label
              htmlFor="displayName"
              className="text-lg text-neutral-800"
            >
              Display Name
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              defaultValue={displayName}
              maxLength={255}
              placeholder="Add a display name"
              className="bg-transparent text-right text-lg text-neutral-800 outline-none placeholder:text-neutral-400"
            />
          </div>

          <div aria-hidden className="mt-16 h-px w-full bg-black/10" />

          <div className="mt-16">
            <div className="flex items-center justify-between">
              <label
                htmlFor="dailyXpGoal"
                className="text-lg text-neutral-800"
              >
                Daily XP Goal
              </label>
              <input
                id="dailyXpGoal"
                name="dailyXpGoal"
                type="number"
                min={20}
                max={100}
                step={1}
                defaultValue={dailyXpGoal}
                className="w-24 bg-transparent text-right text-lg text-neutral-800 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
            <p className="mt-8 text-xs text-neutral-500">
              This is your daily target. A higher goal means faster progress.
            </p>
          </div>

          <div aria-hidden className="mt-16 h-px w-full bg-black/10" />

          <div className="mt-16">
            <Button type="submit" variant="primary">
              Save changes
            </Button>
          </div>
        </form>

        <h2 className="mt-64 font-sans text-lg font-medium text-neutral-800">
          Account
        </h2>

        <div className="mt-32 flex items-center justify-between">
          <span className="text-lg text-neutral-800">Email</span>
          <span className="text-lg text-neutral-800">{email}</span>
        </div>

        <div aria-hidden className="mt-16 h-px w-full bg-black/10" />

        <form action={signOut} className="mt-16">
          <Button type="submit" variant="secondary">
            Log out
          </Button>
        </form>
      </div>
    </>
  );
}
