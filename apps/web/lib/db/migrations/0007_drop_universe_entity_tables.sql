-- Drop dependent tables first (in correct order)
DROP TABLE IF EXISTS "public"."metaverse_activity_logs";
DROP TABLE IF EXISTS "public"."entity_tags";
DROP TABLE IF EXISTS "public"."tags";
DROP TABLE IF EXISTS "public"."entities";
DROP TABLE IF EXISTS "public"."universes";

-- Drop enums
DROP TYPE IF EXISTS "public"."entity_type";
DROP TYPE IF EXISTS "public"."entity_status"; 