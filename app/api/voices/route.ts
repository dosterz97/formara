// app/api/voices/route.ts
import { NextResponse } from "next/server";

// Cache voices to avoid repeated API calls
let voicesCache: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function GET() {
	try {
		const currentTime = Date.now();

		// Return cached voices if available and not expired
		if (voicesCache && currentTime - lastFetchTime < CACHE_DURATION) {
			return NextResponse.json(voicesCache);
		}

		// Get API key from environment
		const apiKey = process.env.ELEVEN_LABS_API_KEY;

		if (!apiKey) {
			return NextResponse.json(
				{ error: "Eleven Labs API key not configured" },
				{ status: 500 }
			);
		}

		// Fetch voices from Eleven Labs API
		const response = await fetch("https://api.elevenlabs.io/v1/voices", {
			method: "GET",
			headers: {
				Accept: "application/json",
				"xi-api-key": apiKey,
			},
		});

		if (!response.ok) {
			throw new Error(
				`Eleven Labs API responded with status: ${response.status}`
			);
		}

		const data = await response.json();

		// Format the response to include only necessary information
		const voices = data.voices.map((voice: any) => ({
			voice_id: voice.voice_id,
			name: voice.name,
			preview_url: voice.preview_url,
			category: voice.category,
		}));

		// Update cache
		voicesCache = voices;
		lastFetchTime = currentTime;

		return NextResponse.json(voices);
	} catch (error) {
		console.error("Error fetching voices:", error);
		return NextResponse.json(
			{ error: "Failed to fetch voices. Please try again later." },
			{ status: 500 }
		);
	}
}
