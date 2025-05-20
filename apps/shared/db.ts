import dotenv from "dotenv";
import { eq } from "drizzle-orm";
import {
	json,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import path from "path";
import postgres from "postgres";

// Load .env from root directory - go up two levels from shared/db.ts to reach root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.POSTGRES_URL) {
	throw new Error("POSTGRES_URL environment variable is not set");
}

// Database client
export const client = postgres(process.env.POSTGRES_URL);
export const db = drizzle(client);

// Entity types from the database schema
export type EntityStatus =
	| "active"
	| "inactive"
	| "deceased"
	| "historical"
	| "conceptual"
	| "unknown";
export type EntityType =
	| "character"
	| "location"
	| "item"
	| "event"
	| "concept"
	| "organization"
	| "other";

// Define the entities table schema
export const entities = pgTable("entities", {
	id: uuid("id").primaryKey(),
	universeId: uuid("universe_id").notNull(),
	slug: varchar("slug", { length: 100 }).notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	entityType: varchar("entity_type", { length: 20 }).notNull(),
	description: text("description"),
	entityStatus: varchar("entity_status", { length: 20 })
		.notNull()
		.default("active"),
	basicAttributes: json("basic_attributes").$type<Record<string, any>>(),
	vectorId: varchar("vector_id", { length: 100 }).notNull(),
	voiceId: varchar("voice_id", { length: 100 }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	createdBy: uuid("created_by"),
});

export type Entity = typeof entities.$inferSelect;

// Function to fetch an entity by ID
export async function getEntityById(id: string): Promise<Entity | null> {
	const result = await db.select().from(entities).where(eq(entities.id, id));
	return result[0] || null;
}
