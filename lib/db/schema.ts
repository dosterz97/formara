import { relations } from "drizzle-orm";
import {
	integer,
	json,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";

// === EXISTING USER & TEAM SYSTEM ===

// === METAVERSE SYSTEM ===

// Enums
export const statusEnum = pgEnum("status", [
	"active",
	"inactive",
	"deceased",
	"historical",
	"conceptual",
	"unknown",
]);

export const TYPES_OF_ENTITIES = [
	"character",
	"location",
	"item",
	"event",
	"concept",
	"organization",
	"other",
] as const;

export const EntityTypes = typeof TYPES_OF_ENTITIES;
export const pgEntityTypeEnum = pgEnum("entity_type", TYPES_OF_ENTITIES);

// Universes table - defines knowledge boundaries
export const users = pgTable("users", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }),
	email: varchar("email", { length: 255 }).notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	role: varchar("role", { length: 20 }).notNull().default("member"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	deletedAt: timestamp("deleted_at"),
});

export const teams = pgTable("teams", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 100 }).notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	stripeCustomerId: text("stripe_customer_id").unique(),
	stripeSubscriptionId: text("stripe_subscription_id").unique(),
	stripeProductId: text("stripe_product_id"),
	planName: varchar("plan_name", { length: 50 }),
	subscriptionStatus: varchar("subscription_status", { length: 20 }),
});

export const teamMembers = pgTable("team_members", {
	id: serial("id").primaryKey(),
	userId: integer("user_id")
		.notNull()
		.references(() => users.id),
	teamId: integer("team_id")
		.notNull()
		.references(() => teams.id),
	role: varchar("role", { length: 50 }).notNull(),
	joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
	id: serial("id").primaryKey(),
	teamId: integer("team_id")
		.notNull()
		.references(() => teams.id),
	userId: integer("user_id").references(() => users.id),
	action: text("action").notNull(),
	timestamp: timestamp("timestamp").notNull().defaultNow(),
	ipAddress: varchar("ip_address", { length: 45 }),
});

export const invitations = pgTable("invitations", {
	id: serial("id").primaryKey(),
	teamId: integer("team_id")
		.notNull()
		.references(() => teams.id),
	email: varchar("email", { length: 255 }).notNull(),
	role: varchar("role", { length: 50 }).notNull(),
	invitedBy: integer("invited_by")
		.notNull()
		.references(() => users.id),
	invitedAt: timestamp("invited_at").notNull().defaultNow(),
	status: varchar("status", { length: 20 }).notNull().default("pending"),
});

export const universes = pgTable(
	"universes",
	{
		id: serial("id").primaryKey(),
		teamId: integer("team_id")
			.notNull()
			.references(() => teams.id),
		slug: varchar("slug", { length: 50 }).notNull(),
		name: varchar("name", { length: 100 }).notNull(),
		description: text("description"),
		rules: json("rules").$type<Record<string, any>>(), // Universe-specific rules
		status: statusEnum("status").default("active"),

		// Vector DB reference - collection name in Qdrant
		vectorNamespace: varchar("vector_namespace", { length: 50 }).notNull(),

		// Metadata
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
		createdBy: integer("created_by").references(() => users.id),
	},
	(table) => {
		return [
			{
				teamSlugIdx: uniqueIndex("universe_team_slug_idx").on(
					table.teamId,
					table.slug
				),
			},
		];
	}
);

// Metaverse entities table - for characters, locations, etc.
export const entities = pgTable(
	"entities",
	{
		id: serial("id").primaryKey(),
		universeId: integer("universe_id")
			.notNull()
			.references(() => universes.id),
		slug: varchar("slug", { length: 100 }).notNull(),
		name: varchar("name", { length: 255 }).notNull(),
		entityType: pgEntityTypeEnum("entity_type").notNull(),
		description: text("description"),
		status: statusEnum("status").default("active"),

		// Basic attributes that may be useful for quick filtering
		basicAttributes: json("basic_attributes").$type<Record<string, any>>(),

		// Vector DB references
		vectorId: varchar("vector_id", { length: 100 }).notNull(), // ID in vector DB

		// Metadata
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
		createdBy: integer("created_by").references(() => users.id),
	},
	(table) => {
		return [
			{
				universeEntityIdx: uniqueIndex("universe_entity_idx").on(
					table.universeId,
					table.entityType,
					table.slug
				),
			},
		];
	}
);

// Tags for categorization
export const tags = pgTable("tags", {
	id: serial("id").primaryKey(),
	universeId: integer("universe_id")
		.notNull()
		.references(() => universes.id),
	name: varchar("name", { length: 100 }).notNull(),
	category: varchar("category", { length: 50 }),
	description: text("description"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	createdBy: integer("created_by").references(() => users.id),
});

// Entity tags association
export const entityTags = pgTable("entity_tags", {
	id: serial("id").primaryKey(),
	entityId: integer("entity_id")
		.notNull()
		.references(() => entities.id),
	tagId: integer("tag_id")
		.notNull()
		.references(() => tags.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	createdBy: integer("created_by").references(() => users.id),
});

// Metaverse activity logs
export const metaverseActivityLogs = pgTable("metaverse_activity_logs", {
	id: serial("id").primaryKey(),
	universeId: integer("universe_id")
		.notNull()
		.references(() => universes.id),
	userId: integer("user_id").references(() => users.id),
	entityId: integer("entity_id").references(() => entities.id),
	action: text("action").notNull(),
	details: json("details").$type<Record<string, any>>(),
	timestamp: timestamp("timestamp").notNull().defaultNow(),
	ipAddress: varchar("ip_address", { length: 45 }),
});

// === EXISTING RELATIONS ===

export const teamsRelations = relations(teams, ({ many }) => ({
	teamMembers: many(teamMembers),
	activityLogs: many(activityLogs),
	invitations: many(invitations),
	universes: many(universes),
}));

export const usersRelations = relations(users, ({ many }) => ({
	teamMembers: many(teamMembers),
	invitationsSent: many(invitations),
	createdUniverses: many(universes, { relationName: "universeCreator" }),
	createdEntities: many(entities, { relationName: "entityCreator" }),
	createdTags: many(tags, { relationName: "tagCreator" }),
	metaverseActivities: many(metaverseActivityLogs),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
	team: one(teams, {
		fields: [invitations.teamId],
		references: [teams.id],
	}),
	invitedBy: one(users, {
		fields: [invitations.invitedBy],
		references: [users.id],
	}),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
	user: one(users, {
		fields: [teamMembers.userId],
		references: [users.id],
	}),
	team: one(teams, {
		fields: [teamMembers.teamId],
		references: [teams.id],
	}),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
	team: one(teams, {
		fields: [activityLogs.teamId],
		references: [teams.id],
	}),
	user: one(users, {
		fields: [activityLogs.userId],
		references: [users.id],
	}),
}));

// === METAVERSE RELATIONS ===

export const universeRelations = relations(universes, ({ one, many }) => ({
	team: one(teams, {
		fields: [universes.teamId],
		references: [teams.id],
	}),
	creator: one(users, {
		fields: [universes.createdBy],
		references: [users.id],
		relationName: "universeCreator",
	}),
	entities: many(entities),
	tags: many(tags),
	activityLogs: many(metaverseActivityLogs),
}));

export const entityRelations = relations(entities, ({ one, many }) => ({
	universe: one(universes, {
		fields: [entities.universeId],
		references: [universes.id],
	}),
	creator: one(users, {
		fields: [entities.createdBy],
		references: [users.id],
		relationName: "entityCreator",
	}),
	tags: many(entityTags),
	activityLogs: many(metaverseActivityLogs),
}));

export const tagRelations = relations(tags, ({ one, many }) => ({
	universe: one(universes, {
		fields: [tags.universeId],
		references: [universes.id],
	}),
	creator: one(users, {
		fields: [tags.createdBy],
		references: [users.id],
		relationName: "tagCreator",
	}),
	entities: many(entityTags),
}));

export const entityTagsRelations = relations(entityTags, ({ one }) => ({
	entity: one(entities, {
		fields: [entityTags.entityId],
		references: [entities.id],
	}),
	tag: one(tags, {
		fields: [entityTags.tagId],
		references: [tags.id],
	}),
	creator: one(users, {
		fields: [entityTags.createdBy],
		references: [users.id],
	}),
}));

export const metaverseActivityLogsRelations = relations(
	metaverseActivityLogs,
	({ one }) => ({
		universe: one(universes, {
			fields: [metaverseActivityLogs.universeId],
			references: [universes.id],
		}),
		user: one(users, {
			fields: [metaverseActivityLogs.userId],
			references: [users.id],
		}),
		entity: one(entities, {
			fields: [metaverseActivityLogs.entityId],
			references: [entities.id],
		}),
	})
);

// === EXISTING TYPE EXPORTS ===

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type TeamDataWithMembers = Team & {
	teamMembers: (TeamMember & {
		user: Pick<User, "id" | "name" | "email">;
	})[];
};

// === METAVERSE TYPE EXPORTS ===

export type Universe = typeof universes.$inferSelect;
export type NewUniverse = typeof universes.$inferInsert;
export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type EntityTag = typeof entityTags.$inferSelect;
export type NewEntityTag = typeof entityTags.$inferInsert;
export type MetaverseActivityLog = typeof metaverseActivityLogs.$inferSelect;
export type NewMetaverseActivityLog = typeof metaverseActivityLogs.$inferInsert;
export type UniverseWithEntities = Universe & {
	entities: Entity[];
};

// === ENUM EXPORTS ===
export enum ActivityType {
	SIGN_UP = "SIGN_UP",
	SIGN_IN = "SIGN_IN",
	SIGN_OUT = "SIGN_OUT",
	UPDATE_PASSWORD = "UPDATE_PASSWORD",
	DELETE_ACCOUNT = "DELETE_ACCOUNT",
	UPDATE_ACCOUNT = "UPDATE_ACCOUNT",
	CREATE_TEAM = "CREATE_TEAM",
	REMOVE_TEAM_MEMBER = "REMOVE_TEAM_MEMBER",
	INVITE_TEAM_MEMBER = "INVITE_TEAM_MEMBER",
	ACCEPT_INVITATION = "ACCEPT_INVITATION",
}

export enum MetaverseActivityType {
	CREATE_UNIVERSE = "CREATE_UNIVERSE",
	UPDATE_UNIVERSE = "UPDATE_UNIVERSE",
	DELETE_UNIVERSE = "DELETE_UNIVERSE",
	CREATE_ENTITY = "CREATE_ENTITY",
	UPDATE_ENTITY = "UPDATE_ENTITY",
	DELETE_ENTITY = "DELETE_ENTITY",
	CREATE_TAG = "CREATE_TAG",
	DELETE_TAG = "DELETE_TAG",
	TAG_ENTITY = "TAG_ENTITY",
	UNTAG_ENTITY = "UNTAG_ENTITY",
	ADD_RELATIONSHIP = "ADD_RELATIONSHIP",
	DELETE_RELATIONSHIP = "DELETE_RELATIONSHIP",
	ADD_KNOWLEDGE = "ADD_KNOWLEDGE",
	UPDATE_KNOWLEDGE = "UPDATE_KNOWLEDGE",
}
