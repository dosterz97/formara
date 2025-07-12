import { NextResponse } from "next/server";
import { processChat } from "~/shared/chat";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ botId: string }> }
) {
	try {
		const { botId } = await params;
		const { message, chatHistory = [] } = await request.json();

		// Use the shared chat processing function
		const result = await processChat({
			botId,
			message,
			chatHistory,
		});

		// Check if result contains an error
		if ("error" in result) {
			// Determine status code based on error type
			const status = result.error === "Bot not found" ? 404 : 400;
			return NextResponse.json(result, { status });
		}

		// Return successful response
		return NextResponse.json(result);
	} catch (error: any) {
		console.error("Error in chat endpoint:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to process chat request" },
			{ status: 500 }
		);
	}
}
