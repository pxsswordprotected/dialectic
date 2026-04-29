CREATE TYPE "public"."practice_session_status" AS ENUM('in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('multiple_choice', 'true_false', 'classify', 'fill_in', 'order');--> statement-breakpoint
CREATE TYPE "public"."review_session_status" AS ENUM('in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."slide_type" AS ENUM('concept', 'example', 'rule', 'warning', 'summary');--> statement-breakpoint
CREATE TYPE "public"."topic_status" AS ENUM('locked', 'available', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."xp_activity_type" AS ENUM('practice_session', 'topic_completed', 'review_completed', 'streak_bonus');--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"slug" varchar(255) NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "practice_question_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"practice_question_id" uuid NOT NULL,
	"is_correct" boolean NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"question_type" "question_type" NOT NULL,
	"prompt" text NOT NULL,
	"question_data" jsonb NOT NULL,
	"explanation" text,
	"difficulty" integer NOT NULL,
	"targets_slide_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"questions" jsonb NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"current_index" integer DEFAULT 0 NOT NULL,
	"status" "practice_session_status" DEFAULT 'in_progress' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" varchar(255),
	"avatar_url" text,
	"daily_xp_goal" integer DEFAULT 100 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"last_active_date" date,
	"timezone" varchar(64) DEFAULT 'America/Chicago' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"next_review_at" timestamp with time zone NOT NULL,
	"interval_days" real DEFAULT 1 NOT NULL,
	"ease_factor" real DEFAULT 2.5 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"questions" jsonb NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"current_index" integer DEFAULT 0 NOT NULL,
	"status" "review_session_status" DEFAULT 'in_progress' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "slides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"slide_type" "slide_type" NOT NULL,
	"heading" varchar(255),
	"content" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topic_prerequisites" (
	"topic_id" uuid NOT NULL,
	"prerequisite_topic_id" uuid NOT NULL,
	CONSTRAINT "topic_prerequisites_topic_id_prerequisite_topic_id_pk" PRIMARY KEY("topic_id","prerequisite_topic_id")
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"slug" varchar(255) NOT NULL,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"status" "topic_status" DEFAULT 'locked' NOT NULL,
	"current_slide_index" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "xp_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"activity_type" "xp_activity_type" NOT NULL,
	"xp_amount" integer NOT NULL,
	"topic_id" uuid,
	"earned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "practice_question_progress" ADD CONSTRAINT "practice_question_progress_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_question_progress" ADD CONSTRAINT "practice_question_progress_practice_question_id_practice_questions_id_fk" FOREIGN KEY ("practice_question_id") REFERENCES "public"."practice_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_questions" ADD CONSTRAINT "practice_questions_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_questions" ADD CONSTRAINT "practice_questions_targets_slide_id_slides_id_fk" FOREIGN KEY ("targets_slide_id") REFERENCES "public"."slides"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_schedule" ADD CONSTRAINT "review_schedule_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_schedule" ADD CONSTRAINT "review_schedule_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_sessions" ADD CONSTRAINT "review_sessions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slides" ADD CONSTRAINT "slides_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_prerequisites" ADD CONSTRAINT "topic_prerequisites_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_prerequisites" ADD CONSTRAINT "topic_prerequisites_prerequisite_topic_id_topics_id_fk" FOREIGN KEY ("prerequisite_topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_log" ADD CONSTRAINT "xp_log_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_log" ADD CONSTRAINT "xp_log_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pqp_user_question_idx" ON "practice_question_progress" USING btree ("user_id","practice_question_id");--> statement-breakpoint
CREATE INDEX "pqp_user_idx" ON "practice_question_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "practice_sessions_user_status_idx" ON "practice_sessions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "practice_sessions_user_topic_status_idx" ON "practice_sessions" USING btree ("user_id","topic_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "review_schedule_user_topic_idx" ON "review_schedule" USING btree ("user_id","topic_id");--> statement-breakpoint
CREATE INDEX "review_schedule_user_next_idx" ON "review_schedule" USING btree ("user_id","next_review_at");--> statement-breakpoint
CREATE INDEX "review_sessions_user_status_idx" ON "review_sessions" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "topics_course_slug_idx" ON "topics" USING btree ("course_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "user_progress_user_topic_idx" ON "user_progress" USING btree ("user_id","topic_id");--> statement-breakpoint
CREATE INDEX "user_progress_user_idx" ON "user_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "xp_log_user_earned_idx" ON "xp_log" USING btree ("user_id","earned_at");