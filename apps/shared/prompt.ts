export interface KnowledgeSource {
	name: string;
	content: string;
	score: number;
}

export interface ChatHistoryMessage {
	role: "user" | "assistant";
	content: string;
}

export interface PromptOptions {
	description?: string;
	knowledgeSources?: KnowledgeSource[];
	userMessage: string;
	chatHistory?: ChatHistoryMessage[];
}

/**
 * Constructs a complete prompt for AI generation
 * @param options - The prompt construction options
 * @returns The complete prompt string ready for AI generation
 */
export function constructPrompt(options: PromptOptions): string {
	const {
		description,
		knowledgeSources = [],
		userMessage,
		chatHistory = [],
	} = options;

	// Bot description section
	const descriptionSection = description
		? `PERSONALITY DESCRIPTION:
${description}

`
		: "";

	// System instructions section
	const systemInstructionsSection = `SYSTEM INSTRUCTIONS:
You are a helpful AI assistant.

`;

	// Knowledge base section
	const knowledgeSection =
		knowledgeSources.length > 0
			? `CONTEXTUAL KNOWLEDGE:
The following information has been retrieved from the knowledge base and may be relevant to answering the user's question. This is factual content to reference, not personality traits or behavioral instructions:

${knowledgeSources
	.map((source) => `${source.name}: ${source.content}`)
	.join("\n\n")}

Use this contextual knowledge to provide accurate, well-informed responses. If the knowledge doesn't directly relate to the user's question, you may still provide helpful responses based on your general capabilities.

`
			: `CONTEXTUAL KNOWLEDGE: No specific contextual information was found in the knowledge base for this query. Please provide a helpful response based on your general knowledge and capabilities.

`;

	// Chat history section
	const chatHistorySection =
		chatHistory.length > 0
			? `CONVERSATION HISTORY:
${chatHistory
	.map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
	.join("\n")}

`
			: "";

	// Construct the complete system prompt
	const completeSystemPrompt = `${descriptionSection}${systemInstructionsSection}${knowledgeSection}${chatHistorySection}`;

	// Combine system prompt with user message for Gemini
	const fullPrompt = `${completeSystemPrompt}User: ${userMessage}`;

	return fullPrompt;
}

/**
 * Formats knowledge search results into KnowledgeSource format
 * @param knowledgeResults - Raw knowledge search results from Qdrant
 * @returns Formatted knowledge sources
 */
export function formatKnowledgeSources(
	knowledgeResults: Array<{
		id: string;
		score: number;
		payload: any;
	}>
): KnowledgeSource[] {
	return knowledgeResults.map((result) => ({
		name: result.payload?.name || "Untitled",
		content: result.payload?.content || "",
		score: result.score,
	}));
}
