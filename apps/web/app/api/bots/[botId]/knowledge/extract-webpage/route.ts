import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize Gemini AI
const getGeminiModel = () => {
	const geminiApiKey = process.env.GEMINI_API_KEY;
	if (!geminiApiKey) {
		throw new Error("GEMINI_API_KEY not configured");
	}
	const genAI = new GoogleGenerativeAI(geminiApiKey);
	return genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });
};

interface JinaResponse {
	code: number;
	status: string;
	data?: {
		title?: string;
		content?: string;
		description?: string;
		url?: string;
	};
	error?: string;
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ botId: string }> }
) {
	try {
		const { botId } = await params;
		const { url, chunkSize = 2000, overlap = 200 } = await request.json();

		if (!url || typeof url !== "string") {
			return NextResponse.json({ error: "URL is required" }, { status: 400 });
		}

		// Validate URL format
		try {
			new URL(url);
		} catch {
			return NextResponse.json(
				{ error: "Invalid URL format" },
				{ status: 400 }
			);
		}

		console.log(`Extracting content from URL: ${url} for bot ${botId}`);

		// Check if Jina AI API key is configured
		const jinaApiKey = process.env.JINA_AI_API_KEY;

		if (!jinaApiKey) {
			return NextResponse.json(
				{
					error:
						"Jina AI API key is not configured. Please add JINA_AI_API_KEY to your environment variables.",
				},
				{ status: 500 }
			);
		}

		// Call Jina AI Reader API with authentication
		const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;

		const jinaResponse = await fetch(jinaUrl, {
			method: "GET",
			headers: {
				Accept: "application/json",
				Authorization: `Bearer ${jinaApiKey}`,
				"X-Return-Format": "json",
				"X-With-Generated-Alt": "true",
				"X-Remove-Selector":
					"header,footer,nav,aside,.ad,.advertisement,.cookie-banner,.social-share",
				"X-Wait-For-Selector": "article,main,.content,.post",
				"User-Agent":
					"Mozilla/5.0 (compatible; FormBot/1.0; +https://formorra.com)",
			},
			// Add timeout to prevent hanging
			signal: AbortSignal.timeout(30000), // 30 second timeout
		});

		if (!jinaResponse.ok) {
			const errorText = await jinaResponse.text();
			console.error(`Jina AI API error: ${jinaResponse.status} - ${errorText}`);

			let errorMessage = "Failed to extract content from webpage";
			if (jinaResponse.status === 404) {
				errorMessage = "The webpage could not be found or accessed";
			} else if (jinaResponse.status === 403) {
				errorMessage = "Access to the webpage was denied";
			} else if (jinaResponse.status === 429) {
				errorMessage = "Rate limit exceeded. Please try again later";
			} else if (jinaResponse.status >= 500) {
				errorMessage = "The extraction service is temporarily unavailable";
			}

			return NextResponse.json({ error: errorMessage }, { status: 500 });
		}

		const contentType = jinaResponse.headers.get("content-type");
		let extractedData: any;

		if (contentType?.includes("application/json")) {
			extractedData = await jinaResponse.json();
		} else {
			// If we get plain text, wrap it in a structure
			const textContent = await jinaResponse.text();
			extractedData = {
				data: {
					content: textContent,
					url: url,
					title:
						extractTitleFromContent(textContent) || "Extracted Web Content",
				},
			};
		}

		// Extract the actual content and metadata
		let title = "";
		let content = "";
		let description = "";

		if (extractedData?.data) {
			title =
				extractedData.data.title ||
				extractTitleFromContent(extractedData.data.content) ||
				"Web Page Content";
			content = extractedData.data.content || "";
			description =
				extractedData.data.description || generateDescription(content);
		} else if (typeof extractedData === "string") {
			content = extractedData;
			title = extractTitleFromContent(content) || "Web Page Content";
			description = generateDescription(content);
		} else {
			throw new Error("Unexpected response format from Jina AI");
		}

		// Clean up content
		content = cleanContent(content);

		if (!content || content.trim().length < 50) {
			return NextResponse.json(
				{ error: "No substantial content could be extracted from the webpage" },
				{ status: 400 }
			);
		}

		// Summarize and clean content with Gemini
		console.log("Summarizing and chunking content with Gemini...");
		const chunks = await summarizeWithGemini(content, title);

		console.log(
			`Successfully extracted and created ${chunks.length} intelligent chunks from ${url}`
		);

		return NextResponse.json({
			chunks: chunks,
			settings: {
				chunkSize,
				overlap,
			},
		});
	} catch (error: any) {
		console.error("Error extracting content:", error);

		let errorMessage = "Failed to extract content from webpage";
		let errorType = "general";

		if (error.name === "TimeoutError") {
			errorMessage =
				"This page is too large or complex to process. Please try a smaller page or upgrade for extended processing.";
			errorType = "timeout";
		} else if (error.message?.includes("network")) {
			errorMessage = "Network error while accessing the webpage";
		}

		return NextResponse.json(
			{
				error: errorMessage,
				errorType: errorType,
			},
			{ status: 500 }
		);
	}
}

// Helper function to extract title from content
function extractTitleFromContent(content: string): string | null {
	if (!content) return null;

	// Look for common title patterns
	const lines = content
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);

	// First non-empty line that's not too long is likely a title
	for (const line of lines) {
		if (line.length > 5 && line.length < 200 && !line.includes("http")) {
			return line;
		}
	}

	return null;
}

// Helper function to generate description from content
function generateDescription(content: string): string {
	if (!content) return "";

	const sentences = content
		.split(/[.!?]+/)
		.map((s) => s.trim())
		.filter(Boolean);
	const firstSentences = sentences.slice(0, 2).join(". ");

	if (firstSentences.length > 300) {
		return firstSentences.substring(0, 297) + "...";
	}

	return firstSentences;
}

// Helper function to clean content
function cleanContent(content: string): string {
	if (!content) return "";

	return (
		content
			// Remove excessive whitespace
			.replace(/\n\s*\n\s*\n/g, "\n\n")
			.replace(/[ \t]+/g, " ")
			// Remove common noise
			.replace(/^\s*Cookie.*?policy.*$/gim, "")
			.replace(/^\s*Privacy.*?policy.*$/gim, "")
			.replace(/^\s*Terms.*?service.*$/gim, "")
			.replace(/^\s*\[.*?\].*$/gm, "") // Remove common annotation patterns
			.trim()
	);
}

// Helper function to summarize content using Gemini
async function summarizeWithGemini(
	content: string,
	title: string
): Promise<Array<{ name: string; content: string }>> {
	const geminiApiKey = process.env.GEMINI_API_KEY;

	if (!geminiApiKey) {
		console.log("Gemini API key not found, skipping summarization");
		// Fallback: return single chunk
		return [
			{
				name: title || "Web Page Content",
				content: content,
			},
		];
	}

	try {
		const model = getGeminiModel();

		const prompt = `Please clean up, summarize, and intelligently chunk this web page content for a knowledge base. Break it into logical sections based on topics or themes.

Title: ${title}

Content: ${content}

Instructions:
- Remove any navigation elements, ads, or irrelevant content
- Break the content into 3-8 logical chunks based on topics/themes
- Each chunk should be substantial (300-2000 characters) and self-contained
- Structure each chunk clearly with proper formatting
- Use markdown formatting for better structure
- Give each chunk a descriptive name that summarizes its content

Return ONLY a valid JSON array with this exact format (no markdown formatting, no "json" prefix, just the raw JSON):
[
  {
    "name": "Descriptive chunk title",
    "content": "The cleaned and formatted content for this section..."
  },
  {
    "name": "Another chunk title", 
    "content": "The content for the next logical section..."
  }
]

IMPORTANT: Return ONLY the JSON array, no other text, no markdown code blocks, no explanations.`;

		const result = await model.generateContent(prompt);
		const response = await result.response;
		const responseText = response.text();

		// Try to parse the JSON response
		try {
			// Clean up the response text in case it has markdown formatting
			let cleanedResponse = responseText.trim();

			// Remove common prefixes that Gemini might add
			if (cleanedResponse.startsWith("json")) {
				cleanedResponse = cleanedResponse.substring(4).trim();
			}
			if (cleanedResponse.startsWith("```json")) {
				cleanedResponse = cleanedResponse.substring(7).trim();
			}
			if (cleanedResponse.endsWith("```")) {
				cleanedResponse = cleanedResponse
					.substring(0, cleanedResponse.length - 3)
					.trim();
			}

			const chunks = JSON.parse(cleanedResponse);
			if (
				Array.isArray(chunks) &&
				chunks.length > 0 &&
				chunks.every(
					(chunk: any) =>
						chunk &&
						chunk.name &&
						chunk.content &&
						typeof chunk.content === "string"
				)
			) {
				// Filter and validate chunks
				const validChunks = chunks
					.filter((chunk: any) => chunk.content.trim().length > 0)
					.map((chunk: any, index: number) => ({
						name: chunk.name || `Chunk ${index + 1}`,
						content: chunk.content.trim(),
					}));

				if (validChunks.length > 0) {
					console.log(
						`Gemini successfully created ${validChunks.length} intelligent chunks`
					);
					return validChunks;
				} else {
					throw new Error("No valid chunks with content");
				}
			} else {
				throw new Error("Invalid chunk format or missing required fields");
			}
		} catch (parseError) {
			console.log(
				"Failed to parse Gemini JSON response, falling back to single chunk:",
				parseError,
				"Raw response:",
				responseText.substring(0, 200) + "..."
			);
			return [
				{
					name: title || "Web Page Content",
					content: responseText, // Use the response as content even if not JSON
				},
			];
		}
	} catch (error) {
		console.error("Gemini summarization failed:", error);
		// Fallback: return single chunk with original content
		return [
			{
				name: title || "Web Page Content",
				content: content,
			},
		];
	}
}
