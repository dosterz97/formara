import { db } from "../drizzle";
import { knowledge } from "../schema";

export async function createKnowledge(data: {
	botId: string;
	slug: string;
	name: string;
	content: string;
	vectorId: string;
	manualEntry?: boolean;
	createdBy?: string;
}) {
	const {
		botId,
		slug,
		name,
		content,
		vectorId,
		manualEntry = false,
		createdBy,
	} = data;
	const result = await db
		.insert(knowledge)
		.values({
			botId,
			slug,
			name,
			content,
			vectorId,
			manualEntry,
			createdBy,
		})
		.returning();
	return result[0];
}
