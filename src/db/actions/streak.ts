import { eq } from "drizzle-orm";
import { profiles, xpLog } from "@/db/schema";
import type { db as dbType } from "@/db";

const STREAK_BONUS_XP = 10;

type Tx = Parameters<Parameters<typeof dbType.transaction>[0]>[0];

function getLocalDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function updateStreakOnXpEarned(
  tx: Tx,
  userId: string,
): Promise<{ streakUpdated: boolean; newStreak: number; bonusAwarded: boolean }> {
  const [profile] = await tx
    .select({
      currentStreak: profiles.currentStreak,
      lastActiveDate: profiles.lastActiveDate,
      timezone: profiles.timezone,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .for("update")
    .limit(1);

  if (!profile) {
    return { streakUpdated: false, newStreak: 0, bonusAwarded: false };
  }

  const now = new Date();
  const localToday = getLocalDate(now, profile.timezone);
  const localYesterday = addDays(localToday, -1);

  // Already active today — no update needed
  if (profile.lastActiveDate === localToday) {
    return { streakUpdated: false, newStreak: profile.currentStreak, bonusAwarded: false };
  }

  let newStreak: number;
  if (profile.lastActiveDate === localYesterday) {
    newStreak = profile.currentStreak + 1;
  } else {
    newStreak = 1;
  }

  await tx
    .update(profiles)
    .set({
      currentStreak: newStreak,
      lastActiveDate: localToday,
      updatedAt: now,
    })
    .where(eq(profiles.id, userId));

  let bonusAwarded = false;
  if (newStreak >= 2) {
    await tx.insert(xpLog).values({
      userId,
      activityType: "streak_bonus",
      xpAmount: STREAK_BONUS_XP,
    });
    bonusAwarded = true;
  }

  return { streakUpdated: true, newStreak, bonusAwarded };
}
