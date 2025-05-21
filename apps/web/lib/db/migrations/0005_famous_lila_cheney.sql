CREATE TABLE "discord_bots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bot_id" uuid NOT NULL,
	"guild_id" varchar(100) NOT NULL,
	"guild_name" varchar(255),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"settings" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bots" RENAME COLUMN "entity_status" TO "status";--> statement-breakpoint
ALTER TABLE "bots" ALTER COLUMN "slug" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "bots" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "discord_bots" ADD CONSTRAINT "discord_bots_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE no action ON UPDATE no action;