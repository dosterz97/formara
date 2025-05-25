import { NextResponse } from "next/server";

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

		const extractedContent = {
			title: title.trim(),
			content: content.trim(),
			description: description.trim(),
			url: url,
		};

		console.log(
			`Successfully extracted ${content.length} characters from ${url}`
		);

		return NextResponse.json({
			extractedContent,
			settings: {
				chunkSize,
				overlap,
			},
		});
	} catch (error: any) {
		console.error("Error extracting content:", error);

		let errorMessage = "Failed to extract content from webpage";
		if (error.name === "TimeoutError") {
			errorMessage = "The webpage took too long to load. Please try again";
		} else if (error.message?.includes("network")) {
			errorMessage = "Network error while accessing the webpage";
		}

		return NextResponse.json({ error: errorMessage }, { status: 500 });
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
