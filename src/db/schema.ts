import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  index,
} from "drizzle-orm/pg-core";

// ── Enums ────────────────────────────────────────────────────────────────────

export const topicStatusEnum = pgEnum("topic_status", [
  "locked",
  "available",
  "in_progress",
  "completed",
]);

export const slideTypeEnum = pgEnum("slide_type", [
  "concept",
  "example",
  "rule",
  "warning",
  "summary",
]);

export const questionTypeEnum = pgEnum("question_type", [
  "multiple_choice",
  "true_false",
  "classify",
  "fill_in",
  "order",
]);

export const xpActivityTypeEnum = pgEnum("xp_activity_type", [
  "practice_session",
  "topic_completed",
  "review_completed",
  "streak_bonus",
]);

export const reviewSessionStatusEnum = pgEnum("review_session_status", [
  "in_progress",
  "completed",
]);

// ── Content Tables ───────────────────────────────────────────────────────────

export const courses = pgTable("courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  isPublished: boolean("is_published").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const topics = pgTable("topics", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  slug: varchar("slug", { length: 255 }).notNull(),
  totalXp: integer("total_xp").default(0).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("topics_course_slug_idx").on(table.courseId, table.slug),
]);

export const topicPrerequisites = pgTable("topic_prerequisites", {
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  prerequisiteTopicId: uuid("prerequisite_topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.topicId, table.prerequisiteTopicId] }),
]);

export const slides = pgTable("slides", {
  id: uuid("id").defaultRandom().primaryKey(),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").default(0).notNull(),
  slideType: slideTypeEnum("slide_type").notNull(),
  heading: varchar("heading", { length: 255 }),
  content: jsonb("content"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const practiceQuestions = pgTable("practice_questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").default(0).notNull(),
  questionType: questionTypeEnum("question_type").notNull(),
  prompt: text("prompt").notNull(),
  questionData: jsonb("question_data").notNull(),
  explanation: text("explanation"),
  difficulty: integer("difficulty").notNull(),
  targetsSlideId: uuid("targets_slide_id").references(() => slides.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── User Tables ──────────────────────────────────────────────────────────────

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // matches auth.users.id — NO defaultRandom
  displayName: varchar("display_name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  dailyXpGoal: integer("daily_xp_goal").default(100).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  lastActiveDate: date("last_active_date"),
  timezone: varchar("timezone", { length: 64 }).default("America/Chicago").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Progress Tables ──────────────────────────────────────────────────────────

export const userProgress = pgTable("user_progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  status: topicStatusEnum("status").default("locked").notNull(),
  currentSlideIndex: integer("current_slide_index").default(0).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("user_progress_user_topic_idx").on(table.userId, table.topicId),
  index("user_progress_user_idx").on(table.userId),
]);

export const practiceQuestionProgress = pgTable("practice_question_progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  practiceQuestionId: uuid("practice_question_id")
    .notNull()
    .references(() => practiceQuestions.id, { onDelete: "cascade" }),
  isCorrect: boolean("is_correct").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("pqp_user_question_idx").on(table.userId, table.practiceQuestionId),
  index("pqp_user_idx").on(table.userId),
]);

export const reviewSchedule = pgTable("review_schedule", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }).notNull(),
  intervalDays: real("interval_days").default(1).notNull(),
  easeFactor: real("ease_factor").default(2.5).notNull(),
  reviewCount: integer("review_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("review_schedule_user_topic_idx").on(table.userId, table.topicId),
  index("review_schedule_user_next_idx").on(table.userId, table.nextReviewAt),
]);

export const reviewSessions = pgTable("review_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  questions: jsonb("questions").$type<Array<{ questionId: string; topicId: string }>>().notNull(),
  answers: jsonb("answers").$type<Record<string, boolean>>().default({}).notNull(),
  currentIndex: integer("current_index").default(0).notNull(),
  status: reviewSessionStatusEnum("status").default("in_progress").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => [
  index("review_sessions_user_status_idx").on(table.userId, table.status),
]);

export const xpLog = pgTable("xp_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  activityType: xpActivityTypeEnum("activity_type").notNull(),
  xpAmount: integer("xp_amount").notNull(),
  topicId: uuid("topic_id").references(() => topics.id, { onDelete: "set null" }),
  earnedAt: timestamp("earned_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("xp_log_user_earned_idx").on(table.userId, table.earnedAt),
]);

// ── Relations ────────────────────────────────────────────────────────────────

export const coursesRelations = relations(courses, ({ many }) => ({
  topics: many(topics),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  course: one(courses, { fields: [topics.courseId], references: [courses.id] }),
  slides: many(slides),
  practiceQuestions: many(practiceQuestions),
  userProgress: many(userProgress),
  reviewSchedules: many(reviewSchedule),
  xpLogs: many(xpLog),
  // prerequisite edges
  prerequisites: many(topicPrerequisites, { relationName: "topicToPrerequisites" }),
  dependents: many(topicPrerequisites, { relationName: "prerequisiteToTopics" }),
}));

export const topicPrerequisitesRelations = relations(topicPrerequisites, ({ one }) => ({
  topic: one(topics, {
    fields: [topicPrerequisites.topicId],
    references: [topics.id],
    relationName: "topicToPrerequisites",
  }),
  prerequisite: one(topics, {
    fields: [topicPrerequisites.prerequisiteTopicId],
    references: [topics.id],
    relationName: "prerequisiteToTopics",
  }),
}));

export const slidesRelations = relations(slides, ({ one, many }) => ({
  topic: one(topics, { fields: [slides.topicId], references: [topics.id] }),
  targetedByQuestions: many(practiceQuestions),
}));

export const practiceQuestionsRelations = relations(practiceQuestions, ({ one, many }) => ({
  topic: one(topics, { fields: [practiceQuestions.topicId], references: [topics.id] }),
  targetsSlide: one(slides, {
    fields: [practiceQuestions.targetsSlideId],
    references: [slides.id],
  }),
  progress: many(practiceQuestionProgress),
}));

export const profilesRelations = relations(profiles, ({ many }) => ({
  userProgress: many(userProgress),
  practiceQuestionProgress: many(practiceQuestionProgress),
  reviewSchedules: many(reviewSchedule),
  xpLogs: many(xpLog),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(profiles, { fields: [userProgress.userId], references: [profiles.id] }),
  topic: one(topics, { fields: [userProgress.topicId], references: [topics.id] }),
}));

export const practiceQuestionProgressRelations = relations(practiceQuestionProgress, ({ one }) => ({
  user: one(profiles, {
    fields: [practiceQuestionProgress.userId],
    references: [profiles.id],
  }),
  practiceQuestion: one(practiceQuestions, {
    fields: [practiceQuestionProgress.practiceQuestionId],
    references: [practiceQuestions.id],
  }),
}));

export const reviewScheduleRelations = relations(reviewSchedule, ({ one }) => ({
  user: one(profiles, { fields: [reviewSchedule.userId], references: [profiles.id] }),
  topic: one(topics, { fields: [reviewSchedule.topicId], references: [topics.id] }),
}));

export const reviewSessionsRelations = relations(reviewSessions, ({ one }) => ({
  user: one(profiles, { fields: [reviewSessions.userId], references: [profiles.id] }),
}));

export const xpLogRelations = relations(xpLog, ({ one }) => ({
  user: one(profiles, { fields: [xpLog.userId], references: [profiles.id] }),
  topic: one(topics, { fields: [xpLog.topicId], references: [topics.id] }),
}));
