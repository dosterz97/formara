import { relations } from "drizzle-orm";
import {
	boolean,
	integer,
	json,
	pgTable,
	real,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

// Users table
export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 100 }),
	email: varchar("email", { length: 255 }).notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	role: varchar("role", { length: 20 }).notNull().default("member"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	deletedAt: timestamp("deleted_at"),
});

// Teams table
export const teams = pgTable("teams", {
	id: uuid("id").primaryKey().defaultRandom(),
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
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id),
	teamId: uuid("team_id")
		.notNull()
		.references(() => teams.id),
	role: varchar("role", { length: 50 }).notNull(),
	joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
	id: uuid("id").primaryKey().defaultRandom(),
	teamId: uuid("team_id")
		.notNull()
		.references(() => teams.id),
	userId: uuid("user_id").references(() => users.id),
	action: text("action").notNull(),
	timestamp: timestamp("timestamp").notNull().defaultNow(),
	ipAddress: varchar("ip_address", { length: 45 }),
});

export const invitations = pgTable("invitations", {
	id: uuid("id").primaryKey().defaultRandom(),
	teamId: uuid("team_id")
		.notNull()
		.references(() => teams.id),
	email: varchar("email", { length: 255 }).notNull(),
	role: varchar("role", { length: 50 }).notNull(),
	invitedBy: uuid("invited_by")
		.notNull()
		.references(() => users.id),
	invitedAt: timestamp("invited_at").notNull().defaultNow(),
	status: varchar("status", { length: 20 }).notNull().default("pending"),
});

// Bots table - for AI assistants/characters
export const bots = pgTable(
	"bots",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id),
		slug: varchar("slug", { length: 100 }).notNull(),
		name: varchar("name", { length: 255 }).notNull(),
		description: text("description"),
		status: varchar("status", { length: 20 }).notNull().default("active"),
		voiceId: varchar("voice_id", { length: 100 }),
		imageUrl: varchar("image_url", { length: 2048 }),
		settings: json("settings").$type<Record<string, any>>(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
		createdBy: uuid("created_by").references(() => users.id),
	},
	(table) => {
		return [
			{
				teamBotSlugIdx: uniqueIndex("bot_team_slug_idx").on(
					table.teamId,
					table.slug
				),
			},
		];
	}
);

// Discord bot relationships
export const discordBots = pgTable(
	"discord_bots",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		botId: uuid("bot_id")
			.notNull()
			.references(() => bots.id),
		guildId: varchar("guild_id", { length: 100 }).notNull(),
		guildName: varchar("guild_name", { length: 255 }),
		status: varchar("status", { length: 20 }).notNull().default("active"),
		settings: json("settings").$type<Record<string, any>>(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => {
		return [
			{
				botGuildIdx: uniqueIndex("bot_guild_idx").on(
					table.botId,
					table.guildId
				),
			},
		];
	}
);

// Bot moderation table
export const botModeration = pgTable("bot_moderation", {
	id: uuid("id").primaryKey().defaultRandom(),
	botId: uuid("bot_id")
		.notNull()
		.references(() => bots.id, { onDelete: "cascade" }),
	enabled: boolean("enabled").notNull().default(false),
	toxicityThreshold: real("toxicity_threshold").notNull().default(0.7),
	harassmentThreshold: real("harassment_threshold").notNull().default(0.7),
	sexualContentThreshold: real("sexual_content_threshold")
		.notNull()
		.default(0.7),
	spamThreshold: real("spam_threshold").notNull().default(0.7),
	actionOnViolation: text("action_on_violation", {
		enum: ["warn", "delete", "timeout"],
	})
		.notNull()
		.default("warn"),
	timeoutDuration: integer("timeout_duration"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const teamsRelations = relations(teams, ({ many }) => ({
	teamMembers: many(teamMembers),
	activityLogs: many(activityLogs),
	invitations: many(invitations),
	bots: many(bots),
}));

export const usersRelations = relations(users, ({ many }) => ({
	teamMembers: many(teamMembers),
	invitationsSent: many(invitations),
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

export const botRelations = relations(bots, ({ one, many }) => ({
	team: one(teams, {
		fields: [bots.teamId],
		references: [teams.id],
	}),
	creator: one(users, {
		fields: [bots.createdBy],
		references: [users.id],
	}),
	discordBots: many(discordBots),
}));

export const discordBotsRelations = relations(discordBots, ({ one }) => ({
	bot: one(bots, {
		fields: [discordBots.botId],
		references: [bots.id],
	}),
}));

// Type exports
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

export type Bot = typeof bots.$inferSelect;
export type NewBot = typeof bots.$inferInsert;
export type BotModeration = typeof botModeration.$inferSelect;
export type NewBotModeration = typeof botModeration.$inferInsert;

// Activity type enum
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
