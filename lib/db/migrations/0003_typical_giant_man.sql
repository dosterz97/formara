ALTER TYPE "public"."status" RENAME TO "entity_status";--> statement-breakpoint
ALTER TABLE "entities" RENAME COLUMN "status" TO "entity_status";--> statement-breakpoint
ALTER TABLE "universes" RENAME COLUMN "status" TO "entity_status";