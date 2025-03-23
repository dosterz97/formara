"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Entity } from "@/lib/db/schema";
import { Bot, Download, Loader2, Play, Send, User } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Simple message type that includes audio data
interface ChatMessage {
	role: "user" | "assistant" | "system";
	content: string | any[]; // Support for text parts
	audio?: {
		data: string;
		format: string;
	};
}

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

				const data = (await response.json()) as Entity;

				setEntity(data);
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

			// Process assistant message and attach audio data
			if (json.messages && Array.isArray(json.messages)) {
				const assistantMessages = json.messages
					.filter((msg: any) => msg.role === "assistant")
					.map((msg: any) => ({
						...msg,
						audio: json.audio, // Attach audio data from response
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

	if (!entity) {
		return (
			<Card className="max-w-4xl mx-auto">
				<CardContent className="pt-6 flex flex-col items-center justify-center h-64">
					<div className="text-muted-foreground">Entity not found</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="max-w-4xl mx-auto p-4">
			{/* Hidden audio element for playing audio */}
			<audio ref={audioRef} className="hidden" controls />

			<Card className="border shadow-lg">
				<CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
					<div className="flex items-center gap-3">
						<Avatar className="h-10 w-10 border-2 border-white">
							<AvatarFallback className="bg-white text-blue-500 font-bold">
								{entity.name.charAt(0)}
							</AvatarFallback>
						</Avatar>
						<div>
							<CardTitle className="flex items-center gap-2">
								{entity.name}
							</CardTitle>
							<p className="text-xs text-white/80">
								{entity.description || "AI Assistant"}
							</p>
						</div>
					</div>
				</CardHeader>

				<ScrollArea className="h-[500px] p-4">
					<CardContent className="pt-6 pb-4">
						{messages.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-96 text-center p-4">
								<Bot
									size={48}
									className="text-muted-foreground mb-4 opacity-50"
								/>
								<h3 className="text-lg font-medium mb-2">
									Start a conversation
								</h3>
								<p className="text-muted-foreground text-sm">
									Send a message to begin chatting with {entity.name}
								</p>
							</div>
						) : (
							<div className="space-y-4">
								{messages.map((message, index) => (
									<div
										key={`${message.role}-${index}`}
										className={`flex gap-3 ${
											message.role === "user" ? "justify-end" : "justify-start"
										}`}
									>
										{message.role !== "user" && (
											<Avatar className="h-8 w-8">
												<AvatarFallback className="bg-purple-100 text-purple-500">
													{entity.name.charAt(0)}
												</AvatarFallback>
											</Avatar>
										)}
										<div
											className={`rounded-lg p-3 max-w-[85%] ${
												message.role === "user"
													? "bg-blue-500 text-white"
													: "bg-gray-100 text-gray-900"
											}`}
										>
											{typeof message.content === "string"
												? message.content
												: message.content
														.filter((part: any) => part.type === "text")
														.map((part: any, partIndex: number) => (
															<div key={partIndex}>{part.text}</div>
														))}
										</div>

										{/* Audio controls for assistant messages */}
										{message.role === "assistant" && message.audio?.data && (
											<div className="flex flex-col gap-1">
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 rounded-full"
													onClick={() =>
														handlePlayAudio(message.audio?.data || "")
													}
													title="Play audio"
												>
													<Play className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 rounded-full"
													onClick={() =>
														handleDownloadAudio(message.audio?.data || "")
													}
													title="Download audio"
												>
													<Download className="h-4 w-4" />
												</Button>
											</div>
										)}

										{message.role === "user" && (
											<Avatar className="h-8 w-8">
												<AvatarFallback className="bg-blue-500 text-white">
													<User size={16} />
												</AvatarFallback>
											</Avatar>
										)}
									</div>
								))}
								<div ref={messagesEndRef} />
							</div>
						)}
					</CardContent>
				</ScrollArea>

				<Separator />

				<CardFooter className="p-4">
					<form
						className="flex w-full gap-2"
						onSubmit={(e) => {
							e.preventDefault();
							handleSendMessage();
						}}
					>
						<Input
							ref={inputRef}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder={`Message ${entity.name}...`}
							className="flex-1"
							disabled={sending}
						/>
						<Button
							type="submit"
							size="icon"
							disabled={!input.trim() || sending}
						>
							{sending ? (
								<Loader2 className="h-5 w-5 animate-spin" />
							) : (
								<Send className="h-5 w-5" />
							)}
						</Button>
					</form>
				</CardFooter>
			</Card>
		</div>
	);
}
