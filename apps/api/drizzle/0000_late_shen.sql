DO $$ BEGIN
 CREATE TYPE "public"."corporate_status" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."doc_verification_status" AS ENUM('PENDING', 'VERIFIED', 'REJECTED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."field_type" AS ENUM('TEXT', 'NUMBER', 'EMAIL', 'PHONE', 'DATE', 'DROPDOWN', 'RADIO', 'CHECKBOX', 'TEXTAREA', 'FILE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."language" AS ENUM('en', 'ur', 'sd', 'ps');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."programme_status" AS ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."role" AS ENUM('SUPER_ADMIN', 'ADMIN', 'CORPORATE_ADMIN');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."subject_type" AS ENUM('MEMBER', 'FAMILY_MEMBER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."submission_status" AS ENUM('DRAFT', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'COMPLETED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."value_kind" AS ENUM('STRUCTURED', 'FREE_TEXT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_corporates" (
	"user_id" uuid NOT NULL,
	"corporate_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_corporates_user_id_corporate_id_pk" PRIMARY KEY("user_id","corporate_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"role" "role" DEFAULT 'ADMIN' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corporates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"short_code" varchar(20) NOT NULL,
	"contact_person" varchar(150),
	"contact_email" varchar(255),
	"contact_phone" varchar(30),
	"address" text,
	"logo_url" varchar(500),
	"status" "corporate_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "corporates_short_code_unique" UNIQUE("short_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "onboarding_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"programme_id" uuid NOT NULL,
	"slug" varchar(120) NOT NULL,
	"token" varchar(64) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "onboarding_links_slug_unique" UNIQUE("slug"),
	CONSTRAINT "onboarding_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "programmes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"corporate_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"start_date" date,
	"end_date" date,
	"status" "programme_status" DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "document_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(40) NOT NULL,
	"name" varchar(150) NOT NULL,
	"name_i18n" jsonb,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "form_field_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field_id" uuid NOT NULL,
	"value" varchar(100) NOT NULL,
	"label" varchar(200) NOT NULL,
	"label_i18n" jsonb,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "form_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"programme_id" uuid NOT NULL,
	"section_id" uuid,
	"field_key" varchar(80) NOT NULL,
	"label" varchar(200) NOT NULL,
	"label_i18n" jsonb,
	"field_type" "field_type" NOT NULL,
	"subject_type" "subject_type" DEFAULT 'MEMBER' NOT NULL,
	"value_kind" "value_kind" DEFAULT 'FREE_TEXT' NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"placeholder" varchar(200),
	"placeholder_i18n" jsonb,
	"help_text" varchar(500),
	"help_text_i18n" jsonb,
	"validation" jsonb,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "form_fields_programme_key_uq" UNIQUE("programme_id","field_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "form_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"programme_id" uuid NOT NULL,
	"title" varchar(150) NOT NULL,
	"title_i18n" jsonb,
	"subject_type" "subject_type" DEFAULT 'MEMBER' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "programme_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"programme_id" uuid NOT NULL,
	"document_type_id" uuid NOT NULL,
	"subject_type" "subject_type" DEFAULT 'MEMBER' NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"allowed_file_types" jsonb NOT NULL,
	"max_file_size_bytes" integer DEFAULT 10485760 NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "programme_documents_uq" UNIQUE("programme_id","document_type_id","subject_type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "family_field_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_member_id" uuid NOT NULL,
	"field_id" uuid NOT NULL,
	"field_key" varchar(80) NOT NULL,
	"value_kind" "value_kind" DEFAULT 'FREE_TEXT' NOT NULL,
	"original_value" text,
	"standardized_value" text,
	"language" "language" DEFAULT 'en' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "family_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"full_name" varchar(200),
	"relationship" varchar(40),
	"cnic" varchar(20),
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "onboarding_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"programme_id" uuid NOT NULL,
	"onboarding_link_id" uuid NOT NULL,
	"session_token" varchar(64) NOT NULL,
	"language" "language" DEFAULT 'en' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "onboarding_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "submission_field_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"field_id" uuid NOT NULL,
	"field_key" varchar(80) NOT NULL,
	"value_kind" "value_kind" DEFAULT 'FREE_TEXT' NOT NULL,
	"original_value" text,
	"standardized_value" text,
	"language" "language" DEFAULT 'en' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"programme_id" uuid NOT NULL,
	"member_name" varchar(200),
	"cnic" varchar(20),
	"email" varchar(255),
	"status" "submission_status" DEFAULT 'DRAFT' NOT NULL,
	"language" "language" DEFAULT 'en' NOT NULL,
	"consent_accepted_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"reviewed_by_user_id" uuid,
	"review_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "uploaded_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"family_member_id" uuid,
	"document_type_id" uuid NOT NULL,
	"subject_type" "subject_type" DEFAULT 'MEMBER' NOT NULL,
	"original_file_name" varchar(255) NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"mime_type" varchar(120) NOT NULL,
	"file_size_bytes" bigint NOT NULL,
	"verification_status" "doc_verification_status" DEFAULT 'PENDING' NOT NULL,
	"verification_notes" text,
	"verified_by_user_id" uuid,
	"verified_at" timestamp with time zone,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"user_email" varchar(255),
	"action" varchar(60) NOT NULL,
	"entity_type" varchar(60),
	"entity_id" varchar(64),
	"ip_address" varchar(64),
	"user_agent" varchar(300),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"to_email" varchar(255) NOT NULL,
	"template" varchar(80) NOT NULL,
	"subject" varchar(255),
	"provider_id" varchar(120),
	"success" boolean DEFAULT false NOT NULL,
	"error" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_corporates" ADD CONSTRAINT "user_corporates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_corporates" ADD CONSTRAINT "user_corporates_corporate_id_corporates_id_fk" FOREIGN KEY ("corporate_id") REFERENCES "public"."corporates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "onboarding_links" ADD CONSTRAINT "onboarding_links_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "programmes" ADD CONSTRAINT "programmes_corporate_id_corporates_id_fk" FOREIGN KEY ("corporate_id") REFERENCES "public"."corporates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "form_field_options" ADD CONSTRAINT "form_field_options_field_id_form_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."form_fields"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_section_id_form_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."form_sections"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "form_sections" ADD CONSTRAINT "form_sections_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "programme_documents" ADD CONSTRAINT "programme_documents_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "programme_documents" ADD CONSTRAINT "programme_documents_document_type_id_document_types_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "public"."document_types"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "family_field_values" ADD CONSTRAINT "family_field_values_family_member_id_family_members_id_fk" FOREIGN KEY ("family_member_id") REFERENCES "public"."family_members"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "family_field_values" ADD CONSTRAINT "family_field_values_field_id_form_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."form_fields"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "family_members" ADD CONSTRAINT "family_members_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "onboarding_sessions" ADD CONSTRAINT "onboarding_sessions_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "onboarding_sessions" ADD CONSTRAINT "onboarding_sessions_onboarding_link_id_onboarding_links_id_fk" FOREIGN KEY ("onboarding_link_id") REFERENCES "public"."onboarding_links"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "submission_field_values" ADD CONSTRAINT "submission_field_values_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "submission_field_values" ADD CONSTRAINT "submission_field_values_field_id_form_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."form_fields"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "submissions" ADD CONSTRAINT "submissions_session_id_onboarding_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."onboarding_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "submissions" ADD CONSTRAINT "submissions_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uploaded_documents" ADD CONSTRAINT "uploaded_documents_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uploaded_documents" ADD CONSTRAINT "uploaded_documents_family_member_id_family_members_id_fk" FOREIGN KEY ("family_member_id") REFERENCES "public"."family_members"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "uploaded_documents" ADD CONSTRAINT "uploaded_documents_document_type_id_document_types_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "public"."document_types"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_corporates_corporate_idx" ON "user_corporates" USING btree ("corporate_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporates_short_code_idx" ON "corporates" USING btree ("short_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corporates_status_idx" ON "corporates" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "onboarding_links_programme_idx" ON "onboarding_links" USING btree ("programme_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "onboarding_links_token_idx" ON "onboarding_links" USING btree ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "programmes_corporate_idx" ON "programmes" USING btree ("corporate_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "programmes_status_idx" ON "programmes" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "form_field_options_field_idx" ON "form_field_options" USING btree ("field_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "form_fields_programme_idx" ON "form_fields" USING btree ("programme_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "form_sections_programme_idx" ON "form_sections" USING btree ("programme_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "programme_documents_programme_idx" ON "programme_documents" USING btree ("programme_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "family_field_values_family_idx" ON "family_field_values" USING btree ("family_member_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "family_members_submission_idx" ON "family_members" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "onboarding_sessions_token_idx" ON "onboarding_sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "onboarding_sessions_programme_idx" ON "onboarding_sessions" USING btree ("programme_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submission_field_values_submission_idx" ON "submission_field_values" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submission_field_values_field_key_idx" ON "submission_field_values" USING btree ("field_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submissions_programme_idx" ON "submissions" USING btree ("programme_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submissions_status_idx" ON "submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submissions_cnic_idx" ON "submissions" USING btree ("cnic");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submissions_email_idx" ON "submissions" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "submissions_created_at_idx" ON "submissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uploaded_documents_submission_idx" ON "uploaded_documents" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "uploaded_documents_status_idx" ON "uploaded_documents" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_logs_to_idx" ON "email_logs" USING btree ("to_email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_logs_created_at_idx" ON "email_logs" USING btree ("created_at");