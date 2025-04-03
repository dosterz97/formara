// src/components/ChatInterface.tsx
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatMessage, Message } from "@/lib/chat";
import { Entity, Universe } from "@/lib/db/schema";
import { Bot, Download, Info, Loader2, Play, Send, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

export interface ChatInterfaceProps {
	universe: Universe;
	entity: Entity;
	initialMessages?: ChatMessage[];
	audioRef?: React.RefObject<HTMLAudioElement>;
}

export function ChatInterface({
	universe,
	entity,
	initialMessages = [],
	audioRef: externalAudioRef,
}: ChatInterfaceProps) {
	const router = useRouter();
	const params = useParams();
	const entityId =
		entity?.id ||
		(Array.isArray(params.entityId)
			? params.entityId[0]
			: (params.entityId as string));

	const convertMessages = (chatMessages: ChatMessage[]): Message[] => {
		return chatMessages.map((msg, index) => ({
			...msg,
			id: msg.id || `msg-${index}-${Date.now()}`,
			sender: msg.role === "user" ? "user" : "character",
			timestamp: msg.timestamp || new Date(),
			content:
				typeof msg.content === "string"
					? msg.content
					: Array.isArray(msg.content)
					? msg.content
							.filter((part: any) => part.type === "text")
							.map((part: any) => part.text)
							.join("\n")
					: String(msg.content),
		}));
	};

	const [messages, setMessages] = useState<Message[]>(
		convertMessages(initialMessages)
	);
	const [inputMessage, setInputMessage] = useState("");
	const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
	const [isTyping, setIsTyping] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sending, setSending] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const internalAudioRef = useRef<HTMLAudioElement | null>(null);
	const audioRef = externalAudioRef || internalAudioRef;
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

	// Scroll to bottom function
	const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
		if (shouldAutoScroll) {
			if (messagesEndRef.current) {
				messagesEndRef.current.scrollIntoView({ behavior });
			} else if (scrollContainerRef.current) {
				scrollContainerRef.current.scrollTop =
					scrollContainerRef.current.scrollHeight;
			}
		}
	};

	// Handle scroll events to determine if we should auto-scroll
	const handleScroll = () => {
		if (scrollContainerRef.current) {
			const { scrollTop, scrollHeight, clientHeight } =
				scrollContainerRef.current;
			const isScrolledNearBottom =
				scrollHeight - scrollTop - clientHeight < 100;
			setShouldAutoScroll(isScrolledNearBottom);
		}
	};

	// Connect ref to ScrollArea
	const setScrollAreaRef = (el: HTMLDivElement) => {
		scrollContainerRef.current = el;
		if (el) {
			el.addEventListener("scroll", handleScroll);
		}
	};

	// Scroll to bottom when messages change
	useEffect(() => {
		scrollToBottom();

		// Initial scroll with auto behavior
		if (messages.length === 0 || messages.length === initialMessages.length) {
			scrollToBottom("auto");
		}
	}, [messages]);

	// Focus input on load
	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, []);

	// Clean up scroll event listener
	useEffect(() => {
		return () => {
			if (scrollContainerRef.current) {
				scrollContainerRef.current.removeEventListener("scroll", handleScroll);
			}
		};
	}, []);

	// Play audio function
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

	// Download audio function
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
		if (!inputMessage.trim() || sending) return;

		try {
			setSending(true);
			setError(null);

			// Add user message
			const userMessage: ChatMessage = {
				role: "user",
				content: inputMessage,
				id: Date.now().toString(),
			};

			const userMessageConverted: Message = {
				...userMessage,
				id: userMessage.id || `msg-${Date.now()}`,
				sender: "user",
				timestamp: new Date(),
			};

			setMessages((prevMessages) => [...prevMessages, userMessageConverted]);
			setInputMessage("");
			setIsTyping(true);

			// Force scroll to bottom after user message is added
			setTimeout(() => scrollToBottom(), 50);

			// Convert our internal messages back to ChatMessage format for API
			const apiMessages = messages.map((msg) => ({
				role: msg.sender === "user" ? "user" : "assistant",
				content: msg.content,
			}));

			// Add the new user message
			apiMessages.push({
				role: "user",
				content: userMessageConverted.content,
			});

			// Send to API
			const response = await fetch(`/api/chat/${entityId}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					messages: apiMessages,
					entity,
					universe, // Pass the universe data to the API
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

			// Process assistant messages
			if (json.messages && Array.isArray(json.messages)) {
				const assistantMessages = json.messages
					.filter((msg: any) => msg.role === "assistant")
					.map((msg: any) => {
						// Convert context data to relevantData format
						const relevantData =
							json.context && json.context.length > 0
								? json.context.map((ctx: any, idx: number) => ({
										id: `rd-${Date.now()}-${idx}`,
										content: ctx.description || "",
										source: ctx.name || "Unknown Entity",
										relevanceScore: ctx.score || 0.5,
										type: "text",
								  }))
								: undefined;

						// Create a message with both audio and context data
						return {
							role: "assistant",
							content: msg.content,
							id: `msg-${Date.now()}-${Math.random()
								.toString(36)
								.substring(2, 9)}`,
							sender: "character",
							timestamp: new Date(),
							audio: json.audio,
							relevantData, // Convert context to relevantData
							context: json.context, // Also keep original context
						} as Message;
					});

				// Add to messages
				console.log(assistantMessages);
				setMessages((prevMessages) => [...prevMessages, ...assistantMessages]);

				// Force scroll to bottom after receiving response
				setTimeout(() => scrollToBottom(), 50);
			}
		} catch (err) {
			console.error("Error sending message:", err);
			setError(err instanceof Error ? err.message : "Failed to send message");
		} finally {
			setIsTyping(false);
			setSending(false);
			inputRef.current?.focus();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const toggleMessageInfo = (messageId: string) => {
		setSelectedMessage(selectedMessage === messageId ? null : messageId);
	};

	return (
		<div className="flex flex-col flex-1 h-full">
			{/* Use internal audio ref only if external not provided */}
			{!externalAudioRef && (
				<audio ref={internalAudioRef} className="hidden" controls />
			)}

			<header className="border-b border-border py-3 px-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-4">
						<Avatar className="h-10 w-10">
							<AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold">
								{entity?.name?.charAt(0) || "A"}
							</AvatarFallback>
						</Avatar>
						<div>
							<h2 className="text-xl font-bold">
								{entity?.name || "AI Character"}
							</h2>
							<p className="text-muted-foreground text-sm max-w-[500px] truncate">
								{entity?.description || "AI Assistant"}
							</p>
						</div>
					</div>
					<div className="flex space-x-3">
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								router.push(
									`/dashboard/universes/${universe.slug}/entities/${entity.slug}`
								)
							}
						>
							Character
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								router.push(`/dashboard/universes/${universe.slug}/entities`)
							}
						>
							Universe
						</Button>
					</div>
				</div>
			</header>

			<div className="flex-1 flex overflow-hidden relative">
				<div className="flex-1 flex flex-col overflow-hidden">
					{/* Use ref forwarding with the ScrollArea component */}
					<div
						className="flex-1 px-6 py-4 overflow-y-auto"
						ref={setScrollAreaRef}
					>
						<div className="space-y-6">
							{messages.length === 0 ? (
								<div className="flex flex-col items-center justify-center h-96 text-center p-4">
									<Bot
										size={48}
										className="text-muted-foreground mb-6 opacity-50"
									/>
									<h3 className="text-lg font-medium mb-3">
										Start a conversation
									</h3>
									<p className="text-muted-foreground text-sm">
										Send a message to begin chatting with {entity?.name || "AI"}
									</p>
								</div>
							) : (
								messages.map((message) => (
									<Collapsible
										key={message.id}
										open={selectedMessage === message.id}
										className={`rounded-lg p-4 ${
											message.sender === "user"
												? "bg-primary-foreground ml-16"
												: "bg-muted mr-16"
										}`}
									>
										<div className="flex justify-between items-start">
											<div className="flex items-start space-x-3">
												{message.sender === "character" ? (
													<Avatar className="h-8 w-8 mt-1">
														<AvatarFallback className="bg-purple-100 text-purple-500">
															{entity?.name?.charAt(0) || "A"}
														</AvatarFallback>
													</Avatar>
												) : (
													<Avatar className="h-8 w-8 mt-1">
														<AvatarFallback className="bg-blue-500 text-white">
															<User className="h-5 w-5" />
														</AvatarFallback>
													</Avatar>
												)}
												<div>
													<div className="flex items-center space-x-3">
														<span className="font-semibold">
															{message.sender === "character"
																? entity?.name || "AI"
																: "You"}
														</span>
														<span className="text-xs text-muted-foreground">
															{message.timestamp.toLocaleTimeString()}
														</span>
													</div>
													<div className="mt-2 text-sm whitespace-pre-wrap">
														{typeof message.content === "string"
															? message.content
															: Array.isArray(message.content)
															? message.content
																	.filter((part: any) => part.type === "text")
																	.map((part: any, idx: number) => (
																		<div key={`${message.id}-part-${idx}`}>
																			{part.text}
																		</div>
																	))
															: JSON.stringify(message.content)}
													</div>
												</div>
											</div>

											<div className="flex">
												{/* Audio controls for assistant messages */}
												{message.sender === "character" &&
													message.audio?.data && (
														<div className="flex space-x-2 mr-3">
															<Button
																variant="ghost"
																size="icon"
																className="h-7 w-7 rounded-full"
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
																className="h-7 w-7 rounded-full"
																onClick={() =>
																	handleDownloadAudio(message.audio?.data || "")
																}
																title="Download audio"
															>
																<Download className="h-4 w-4" />
															</Button>
														</div>
													)}

												{/* Info button for context data */}
												{message.sender === "character" &&
													(message.relevantData || message.context) && (
														<CollapsibleTrigger asChild>
															<Button
																variant="ghost"
																size="icon"
																onClick={() => toggleMessageInfo(message.id)}
																className="shrink-0 h-7 w-7"
															>
																<Info className="h-4 w-4" />
																<span className="sr-only">
																	Toggle message info
																</span>
															</Button>
														</CollapsibleTrigger>
													)}
											</div>
										</div>

										{message.sender === "character" && (
											<CollapsibleContent className="mt-5 space-y-4 border-t pt-4">
												<div className="flex items-center justify-between">
													<h4 className="text-sm font-medium">
														Relevant Data Sources
													</h4>
													<Badge variant="outline" className="text-xs">
														{message.context?.length ||
															message.relevantData?.length ||
															0}{" "}
														sources
													</Badge>
												</div>

												<div className="space-y-3">
													{/* Show context data if available, otherwise fall back to relevantData */}
													{message.context
														? message.context.map((ctx) => (
																<Card key={ctx.id} className="text-sm">
																	<CardContent className="p-4 space-y-2">
																		<div className="flex items-center justify-between">
																			<Badge
																				variant="secondary"
																				className="text-xs"
																			>
																				{ctx.name}
																			</Badge>
																			<Badge
																				variant="outline"
																				className="text-xs"
																			>
																				{ctx.entityType}
																			</Badge>
																		</div>
																		<p className="text-xs mt-2 text-muted-foreground">
																			{ctx.description}
																		</p>
																		<div className="text-xs text-right">
																			Score: {(ctx.score * 100).toFixed(0)}%
																		</div>
																	</CardContent>
																</Card>
														  ))
														: message.relevantData
														? message.relevantData.map((data) => (
																<Card key={data.id} className="text-sm">
																	<CardContent className="p-4 space-y-2">
																		<div className="flex items-center justify-between">
																			<Badge
																				variant="secondary"
																				className="text-xs"
																			>
																				{data.source}
																			</Badge>
																			<Badge
																				variant="outline"
																				className="text-xs"
																			>
																				Score: {data.relevanceScore.toFixed(2)}
																			</Badge>
																		</div>
																		<p className="text-xs mt-2">
																			{data.content}
																		</p>
																	</CardContent>
																</Card>
														  ))
														: null}
												</div>
											</CollapsibleContent>
										)}
									</Collapsible>
								))
							)}

							{isTyping && (
								<div className="bg-muted rounded-lg p-4 mr-16 animate-pulse flex items-center space-x-3">
									<Avatar className="h-8 w-8">
										<AvatarFallback className="bg-purple-100 text-purple-500">
											{entity?.name?.charAt(0) || "A"}
										</AvatarFallback>
									</Avatar>
									<div className="text-sm text-muted-foreground">Typing...</div>
								</div>
							)}

							{/* This div is the anchor for scrolling to bottom */}
							<div ref={messagesEndRef} />
						</div>
					</div>

					<div className="px-6 py-4 border-t">
						<form
							className="flex space-x-3"
							onSubmit={(e) => {
								e.preventDefault();
								handleSendMessage();
							}}
						>
							<Input
								ref={inputRef}
								value={inputMessage}
								onChange={(e) => setInputMessage(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder={`Message ${entity?.name || "AI"}...`}
								className="flex-1"
								disabled={sending || isTyping}
							/>
							<Button
								type="submit"
								disabled={!inputMessage.trim() || sending || isTyping}
								size="icon"
							>
								{sending ? (
									<Loader2 className="h-5 w-5 animate-spin" />
								) : (
									<Send className="h-5 w-5" />
								)}
								<span className="sr-only">Send message</span>
							</Button>
						</form>
						{error && (
							<div className="mt-3 text-sm text-red-500">Error: {error}</div>
						)}
					</div>
				</div>

				<div className="w-96 border-l hidden lg:block overflow-y-auto">
					<Tabs defaultValue="context">
						<TabsList className="w-full grid grid-cols-2">
							<TabsTrigger value="context">Context</TabsTrigger>
							<TabsTrigger value="settings">Settings</TabsTrigger>
						</TabsList>

						<TabsContent value="context" className="p-5 space-y-6">
							<div>
								<h3 className="font-medium mb-3">Universe Knowledge</h3>
								<Card>
									<CardContent className="p-4 space-y-3 text-sm">
										<div className="flex justify-between items-center">
											<h4 className="font-medium">
												{entity?.name || "AI"} Universe
											</h4>
											<Badge variant="outline" className="text-xs">
												Core Knowledge
											</Badge>
										</div>
										<p className="text-xs">
											{entity?.description ||
												"AI character in the Formora system"}
										</p>
									</CardContent>
								</Card>
							</div>

							<div>
								<h3 className="font-medium mb-3">Character Profile</h3>
								<Card>
									<CardContent className="p-4 space-y-3 text-sm">
										<div className="flex justify-between items-center">
											<h4 className="font-medium">Background</h4>
											<Badge variant="outline" className="text-xs">
												Character Trait
											</Badge>
										</div>
										<p className="text-xs">
											{entity?.description ||
												"AI character with access to the Formora knowledge database"}
										</p>
									</CardContent>
								</Card>
							</div>

							<div>
								<h3 className="font-medium mb-3">Conversation History</h3>
								<Card>
									<CardContent className="p-4 text-sm">
										<p className="text-muted-foreground text-xs">
											Displaying current conversation
										</p>
										<p className="text-xs mt-3">
											{messages.length} messages in this conversation
										</p>
									</CardContent>
								</Card>
							</div>
						</TabsContent>

						<TabsContent value="settings" className="p-5 space-y-6">
							<Card>
								<CardHeader className="p-4 pb-2">
									<CardTitle className="text-sm">Response Settings</CardTitle>
								</CardHeader>
								<CardContent className="p-4 pt-2 space-y-4">
									<div className="grid grid-cols-2 gap-3 text-xs">
										<div className="space-y-2">
											<label className="font-medium">Temperature</label>
											<Input
												type="range"
												min="0"
												max="1"
												step="0.1"
												defaultValue="0.7"
											/>
										</div>
										<div className="space-y-2">
											<label className="font-medium">Top P</label>
											<Input
												type="range"
												min="0"
												max="1"
												step="0.05"
												defaultValue="0.9"
											/>
										</div>
									</div>
									<div className="grid grid-cols-1 gap-2 text-xs">
										<label className="font-medium">Max Context Items</label>
										<Input type="number" min="1" max="20" defaultValue="5" />
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="p-4 pb-2">
									<CardTitle className="text-sm">Database Settings</CardTitle>
								</CardHeader>
								<CardContent className="p-4 pt-2 space-y-4">
									<div className="space-y-2 text-xs">
										<label className="font-medium">Relevance Threshold</label>
										<Input
											type="range"
											min="0"
											max="1"
											step="0.05"
											defaultValue="0.7"
										/>
									</div>
									<div className="grid grid-cols-2 gap-3 text-xs">
										<div className="space-y-2">
											<label className="font-medium">Max Sources</label>
											<Input type="number" min="1" max="10" defaultValue="5" />
										</div>
										<div className="space-y-2">
											<label className="font-medium">Audio Enabled</label>
											<Button variant="outline" size="sm" className="w-full">
												Enabled
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
}

export default ChatInterface;
