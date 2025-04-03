"use client";

import ChatInterface from "@/components/chat/chat-interface";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatMessage } from "@/lib/chat";
import { Entity, Universe } from "@/lib/db/schema";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Page() {
	const params = useParams();
	const entityId = Array.isArray(params.entityId)
		? params.entityId[0]
		: (params.entityId as string);

	const [input, setInput] = useState("");
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [entity, setEntity] = useState<Entity | undefined>();
	const [universe, setUniverse] = useState<Universe | undefined>();
	const [audioUrl, setAudioUrl] = useState<string | null>(null);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const audioRef = useRef<HTMLAudioElement>(null);

	// Fetch entity data
	useEffect(() => {
		const fetchEntity = async () => {
			try {
				setLoading(true);
				setError(null);

				const response = await fetch(`/api/entities/${entityId}`);

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Failed to fetch entity");
				}

				const data = await response.json();

				// Update to handle new response format that includes both entity and universe
				setEntity(data.entity);
				setUniverse(data.universe);
			} catch (err) {
				console.error("Error fetching entity:", err);
				setError(
					err instanceof Error ? err.message : "An unknown error occurred"
				);
			} finally {
				setLoading(false);
			}
		};

		if (entityId) {
			fetchEntity();
		}
	}, [entityId]);

	// Scroll to bottom of messages
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// Focus input on load
	useEffect(() => {
		if (!loading && inputRef.current) {
			inputRef.current.focus();
		}
	}, [loading]);

	// Play audio for a specific message
	const handlePlayAudio = (audioData: string) => {
		if (audioRef.current) {
			// Clean up previous audio URL if it exists
			if (audioUrl) {
				URL.revokeObjectURL(audioUrl);
			}

			try {
				// Create a blob from the base64 data
				const byteCharacters = atob(audioData);
				const byteNumbers = new Array(byteCharacters.length);

				for (let i = 0; i < byteCharacters.length; i++) {
					byteNumbers[i] = byteCharacters.charCodeAt(i);
				}

				const byteArray = new Uint8Array(byteNumbers);
				const blob = new Blob([byteArray], { type: "audio/mp3" });

				// Create a URL for the blob
				const url = URL.createObjectURL(blob);
				setAudioUrl(url);

				// Set the audio source and play
				audioRef.current.src = url;
				audioRef.current.play().catch((err) => {
					console.error("Error playing audio:", err);
				});
			} catch (error) {
				console.error("Error processing audio data:", error);
			}
		}
	};

	// Download audio for a specific message
	const handleDownloadAudio = (audioData: string) => {
		try {
			// Create a blob from the base64 data
			const byteCharacters = atob(audioData);
			const byteNumbers = new Array(byteCharacters.length);

			for (let i = 0; i < byteCharacters.length; i++) {
				byteNumbers[i] = byteCharacters.charCodeAt(i);
			}

			const byteArray = new Uint8Array(byteNumbers);
			const blob = new Blob([byteArray], { type: "audio/mp3" });

			// Create a URL for the blob
			const url = URL.createObjectURL(blob);

			// Create and click a download link
			const a = document.createElement("a");
			a.href = url;
			a.download = `${entity?.name || "assistant"}-message.mp3`;
			document.body.appendChild(a);
			a.click();

			// Clean up
			setTimeout(() => {
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			}, 100);
		} catch (error) {
			console.error("Error downloading audio:", error);
		}
	};

	const handleSendMessage = async () => {
		if (!input.trim() || sending) return;

		try {
			setSending(true);

			const userMessage: ChatMessage = { role: "user", content: input };
			setMessages((currentMessages) => [...currentMessages, userMessage]);
			setInput("");

			const response = await fetch(`/api/chat/${entity?.id}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					messages: [...messages, userMessage],
					entity,
					universe,
					options: {
						audio: true,
					},
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to send message");
			}

			const json = await response.json();
			console.log("API response:", json);

			// Process assistant message and attach audio and context data
			if (json.messages && Array.isArray(json.messages)) {
				const assistantMessages = json.messages
					.filter((msg: any) => msg.role === "assistant")
					.map((msg: any) => ({
						...msg,
						audio: json.audio, // Attach audio data from response
						context: json.context, // Attach context information
					})) as ChatMessage[];

				setMessages((currentMessages) => [
					...currentMessages,
					...assistantMessages,
				]);
			}
		} catch (err) {
			console.error("Error sending message:", err);
			setError(err instanceof Error ? err.message : "Failed to send message");
		} finally {
			setSending(false);
			inputRef.current?.focus();
		}
	};

	if (loading) {
		return (
			<div className="max-w-4xl mx-auto p-4 space-y-4">
				<Skeleton className="h-12 w-3/4" />
				<Skeleton className="h-64 w-full" />
				<Skeleton className="h-12 w-full" />
			</div>
		);
	}

	if (error) {
		return (
			<Card className="max-w-4xl mx-auto p-4 bg-red-50 border-red-200">
				<CardContent className="pt-6">
					<div className="text-red-500 font-medium">Error: {error}</div>
					<Button
						variant="outline"
						className="mt-4"
						onClick={() => window.location.reload()}
					>
						Try Again
					</Button>
				</CardContent>
			</Card>
		);
	}

	if (!entity || !universe) {
		return (
			<Card className="max-w-4xl mx-auto">
				<CardContent className="pt-6 flex flex-col items-center justify-center h-64">
					<div className="text-muted-foreground">Entity not found</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<audio ref={audioRef} className="hidden" />
			<ChatInterface
				entity={entity}
				universe={universe}
				initialMessages={messages}
			/>
			<div ref={messagesEndRef} />
		</>
	);
}
