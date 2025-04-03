// Type for context items from API search

// Types
export interface ChatMessage {
	role: "user" | "assistant" | "system";
	content: string | any[]; // Support for text parts
	id?: string;
	timestamp?: Date;
	audio?: {
		data: string;
		format: string;
	};
	relevantData?: RelevantData[];
	// Add context from API
	context?: ContextItem[];
}

export interface ContextItem {
	id: string;
	name: string;
	entityType: string;
	description: string;
	score: number;
}

export interface Message extends ChatMessage {
	id: string;
	sender: "user" | "character";
	timestamp: Date;
}

export interface RelevantData {
	id: string;
	content: string;
	source: string;
	relevanceScore: number;
	type: "text" | "image" | "audio" | "video";
}
