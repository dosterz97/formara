import { openai } from "@ai-sdk/openai";
import { CoreMessage, generateText } from "ai";

export async function POST(req: Request) {
	const { messages }: { messages: CoreMessage[] } = await req.json();

	const { response } = await generateText({
		model: openai("gpt-4"),
		system: "You are a helpful assistant.",
		messages,
	});

	return Response.json({ messages: response.messages });
}
