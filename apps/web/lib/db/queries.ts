import { verifyToken } from "@/lib/auth/session";
import { and, desc, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "./drizzle";
import { initializeBotKnowledgeCollection } from "./qdrant-client";
import { activityLogs, bots, teamMembers, teams, users } from "./schema";

export async function getUser() {
	const sessionCookie = (await cookies()).get("session");
	if (!sessionCookie || !sessionCookie.value) {
		return null;
	}

	const sessionData = await verifyToken(sessionCookie.value);
	if (
		!sessionData ||
		!sessionData.user ||
		typeof sessionData.user.id !== "string"
	) {
		return null;
	}

	if (new Date(sessionData.expires) < new Date()) {
		return null;
	}

	const user = await db
		.select()
		.from(users)
		.where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
		.limit(1);

	if (user.length === 0) {
		return null;
	}

	return user[0];
}

export async function getTeamByStripeCustomerId(customerId: string) {
	const result = await db
		.select()
		.from(teams)
		.where(eq(teams.stripeCustomerId, customerId))
		.limit(1);

	return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
	teamId: string,
	subscriptionData: {
		stripeSubscriptionId: string | null;
		stripeProductId: string | null;
		planName: string | null;
		subscriptionStatus: string;
	}
) {
	await db
		.update(teams)
		.set({
			...subscriptionData,
			updatedAt: new Date(),
		})
		.where(eq(teams.id, teamId));
}

export async function getUserWithTeam(userId: string) {
	const result = await db
		.select({
			user: users,
			teamId: teamMembers.teamId,
		})
		.from(users)
		.leftJoin(teamMembers, eq(users.id, teamMembers.userId))
		.where(eq(users.id, userId))
		.limit(1);

	return result[0];
}

export async function getActivityLogs() {
	const user = await getUser();
	if (!user) {
		throw new Error("User not authenticated");
	}

	return await db
		.select({
			id: activityLogs.id,
			action: activityLogs.action,
			timestamp: activityLogs.timestamp,
			ipAddress: activityLogs.ipAddress,
			userName: users.name,
		})
		.from(activityLogs)
		.leftJoin(users, eq(activityLogs.userId, users.id))
		.where(eq(activityLogs.userId, user.id))
		.orderBy(desc(activityLogs.timestamp))
		.limit(10);
}

export async function getTeamForUser(userId: string) {
	const result = await db.query.users.findFirst({
		where: eq(users.id, userId),
		with: {
			teamMembers: {
				with: {
					team: {
						with: {
							teamMembers: {
								with: {
									user: {
										columns: {
											id: true,
											name: true,
											email: true,
										},
									},
								},
							},
						},
					},
				},
			},
		},
	});

	return result?.teamMembers[0]?.team || null;
}

/**
 * Creates a new bot with Qdrant collection initialization
 * @param botData The bot data to create
 * @returns The created bot
 */
export async function createBotWithKnowledge(botData: {
	teamId: string;
	name: string;
	slug: string;
	description?: string;
	createdBy: string;
	status?: string;
}) {
	// Create the bot in the database
	const [newBot] = await db
		.insert(bots)
		.values({
			teamId: botData.teamId,
			name: botData.name,
			slug: botData.slug,
			description: botData.description,
			status: botData.status || "active",
			createdBy: botData.createdBy,
		})
		.returning();

	// Initialize the Qdrant collection for the new bot
	await initializeBotKnowledgeCollection(newBot.id);

	return newBot;
}
