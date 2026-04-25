import { eq, gte, sum, and } from "drizzle-orm";
import { db } from "@/db";
import { profiles, xpLog } from "@/db/schema";

function getLocalDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function localMidnightToUtc(dateStr: string, timezone: string): Date {
  // Create a date formatter that gives us the UTC offset for this timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "shortOffset",
  });

  // Parse the local midnight and figure out the UTC equivalent
  // by using a temporary date at noon UTC on that day, then adjusting
  const parts = formatter.formatToParts(new Date(dateStr + "T12:00:00Z"));
  const offsetPart = parts.find((p) => p.type === "timeZoneName");
  const offsetStr = offsetPart?.value ?? "GMT";

  // Parse offset like "GMT-6" or "GMT+5:30"
  const match = offsetStr.match(/GMT([+-]?)(\d+)?(?::(\d+))?/);
  let offsetMinutes = 0;
  if (match) {
    const sign = match[1] === "-" ? -1 : 1;
    const hours = parseInt(match[2] || "0", 10);
    const minutes = parseInt(match[3] || "0", 10);
    offsetMinutes = sign * (hours * 60 + minutes);
  }

  // Local midnight = UTC midnight minus the offset
  const utcMidnight = new Date(dateStr + "T00:00:00Z");
  utcMidnight.setUTCMinutes(utcMidnight.getUTCMinutes() - offsetMinutes);
  return utcMidnight;
}

export async function getStreakDisplayData(userId: string) {
  // First get the user's timezone
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
    columns: {
      currentStreak: true,
      dailyXpGoal: true,
      timezone: true,
      lastActiveDate: true,
    },
  });

  if (!profile) {
    return { currentStreak: 0, dailyXpEarned: 0, dailyXpGoal: 100 };
  }

  const now = new Date();
  const localToday = getLocalDate(now, profile.timezone);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const localYesterday = getLocalDate(yesterday, profile.timezone);
  const startOfTodayUtc = localMidnightToUtc(localToday, profile.timezone);

  const [xpResult] = await db
    .select({ total: sum(xpLog.xpAmount) })
    .from(xpLog)
    .where(
      and(
        eq(xpLog.userId, userId),
        gte(xpLog.earnedAt, startOfTodayUtc),
      ),
    );

  const lastActive = profile.lastActiveDate;
  const isAlive =
    lastActive === localToday || lastActive === localYesterday;
  const effectiveStreak = isAlive ? profile.currentStreak : 0;

  return {
    currentStreak: effectiveStreak,
    dailyXpEarned: Number(xpResult?.total ?? 0),
    dailyXpGoal: profile.dailyXpGoal,
  };
}
