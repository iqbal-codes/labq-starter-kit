CREATE TYPE "public"."confidence_level" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('IDR', 'USD', 'SGD');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('full_time', 'contract', 'part_time', 'freelance');--> statement-breakpoint
CREATE TYPE "public"."english_level" AS ENUM('none', 'basic', 'conversational', 'professional', 'fluent', 'native');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('new', 'saved', 'preparing', 'applied', 'interviewing', 'rejected', 'closed', 'filtered_out');--> statement-breakpoint
CREATE TYPE "public"."match_category" AS ENUM('excellent', 'strong', 'good', 'possible', 'low');--> statement-breakpoint
CREATE TYPE "public"."red_flag_type" AS ENUM('warning', 'dealbreaker');--> statement-breakpoint
CREATE TYPE "public"."seniority" AS ENUM('junior', 'mid', 'senior', 'lead', 'principal', 'staff');--> statement-breakpoint
CREATE TYPE "public"."work_mode" AS ENUM('remote', 'hybrid', 'onsite');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_kit" (
	"id" text PRIMARY KEY NOT NULL,
	"job_match_id" text NOT NULL,
	"user_id" text NOT NULL,
	"cover_letter" text,
	"personalization_checklist" jsonb,
	"recruiter_message" text,
	"hiring_manager_message" text,
	"referral_message" text,
	"resume_suggestions" jsonb,
	"bullet_rewrites" jsonb,
	"interview_prep_checklist" jsonb,
	"skill_gap_notes" jsonb,
	"language" text DEFAULT 'en' NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"regenerated_at" timestamp,
	"generation_model" text,
	"generation_tokens" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "career_target" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"target_role" text NOT NULL,
	"target_seniority" "seniority",
	"target_regions" jsonb,
	"work_mode" "work_mode"[],
	"employment_type" "employment_type"[],
	"expected_salary_min" integer,
	"expected_salary_max" integer,
	"salary_currency" "currency",
	"preferred_company_types" jsonb,
	"preferred_industries" jsonb,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"company" text NOT NULL,
	"company_logo" text,
	"location" text,
	"work_mode" "work_mode",
	"employment_type" "employment_type",
	"salary_text" text,
	"salary_min" integer,
	"salary_max" integer,
	"salary_currency" "currency",
	"salary_period" text,
	"required_skills" jsonb,
	"nice_to_have_skills" jsonb,
	"seniority" "seniority",
	"responsibilities" jsonb,
	"requirements" jsonb,
	"language_requirement" text,
	"visa_sponsorship" boolean DEFAULT false,
	"relocation_support" boolean DEFAULT false,
	"source_url" text NOT NULL,
	"apply_url" text,
	"source_name" text,
	"source_confidence" integer DEFAULT 100,
	"posted_date" timestamp,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"raw_description" text,
	"parsing_confidence" integer DEFAULT 100,
	"parsing_errors" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_match" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"job_id" text NOT NULL,
	"career_target_id" text,
	"match_score" integer NOT NULL,
	"match_category" "match_category",
	"confidence_score" integer,
	"confidence_level" "confidence_level",
	"match_reasons" jsonb,
	"risk_factors" jsonb,
	"role_fit_score" integer,
	"skill_fit_score" integer,
	"seniority_fit_score" integer,
	"salary_fit_score" integer,
	"location_fit_score" integer,
	"language_fit_score" integer,
	"status" "job_status" DEFAULT 'new' NOT NULL,
	"recommended_action" text,
	"is_filtered_out" boolean DEFAULT false,
	"filter_reason" text,
	"matched_at" timestamp DEFAULT now() NOT NULL,
	"status_updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"full_name" text,
	"headline" text,
	"location" text,
	"linkedin_url" text,
	"github_url" text,
	"portfolio_url" text,
	"current_role" text,
	"current_company" text,
	"total_years_experience" numeric,
	"seniority" "seniority",
	"english_level" "english_level",
	"skills" jsonb,
	"skill_proficiencies" jsonb,
	"work_experiences" jsonb,
	"project_highlights" jsonb,
	"achievements" jsonb,
	"education" jsonb,
	"cv_url" text,
	"cv_original_name" text,
	"cv_parsed_at" timestamp,
	"completion_percentage" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "red_flag" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "red_flag_type" NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"detect_keywords" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_kit" ADD CONSTRAINT "application_kit_job_match_id_job_match_id_fk" FOREIGN KEY ("job_match_id") REFERENCES "public"."job_match"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_kit" ADD CONSTRAINT "application_kit_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_target" ADD CONSTRAINT "career_target_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_match" ADD CONSTRAINT "job_match_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_match" ADD CONSTRAINT "job_match_job_id_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_match" ADD CONSTRAINT "job_match_career_target_id_career_target_id_fk" FOREIGN KEY ("career_target_id") REFERENCES "public"."career_target"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "red_flag" ADD CONSTRAINT "red_flag_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "application_kit_jobMatchId_idx" ON "application_kit" USING btree ("job_match_id");--> statement-breakpoint
CREATE INDEX "application_kit_userId_idx" ON "application_kit" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "career_target_userId_idx" ON "career_target" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "career_target_active_idx" ON "career_target" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "job_title_idx" ON "job" USING btree ("title");--> statement-breakpoint
CREATE INDEX "job_company_idx" ON "job" USING btree ("company");--> statement-breakpoint
CREATE INDEX "job_active_idx" ON "job" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "job_source_idx" ON "job" USING btree ("source_name");--> statement-breakpoint
CREATE INDEX "job_match_userId_idx" ON "job_match" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "job_match_jobId_idx" ON "job_match" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_match_status_idx" ON "job_match" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_match_score_idx" ON "job_match" USING btree ("match_score");--> statement-breakpoint
CREATE INDEX "profile_userId_idx" ON "profile" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "red_flag_userId_idx" ON "red_flag" USING btree ("user_id");