CREATE TABLE "bot_moderation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bot_id" uuid NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"toxicity_threshold" real DEFAULT 0.7 NOT NULL,
	"harassment_threshold" real DEFAULT 0.7 NOT NULL,
	"sexual_content_threshold" real DEFAULT 0.7 NOT NULL,
	"spam_threshold" real DEFAULT 0.7 NOT NULL,
	"action_on_violation" text DEFAULT 'warn' NOT NULL,
	"timeout_duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bot_moderation" ADD CONSTRAINT "bot_moderation_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;