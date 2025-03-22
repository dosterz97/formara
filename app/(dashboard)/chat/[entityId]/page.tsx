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
import { CoreMessage } from "ai";
import { Bot, Loader2, Send, User } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Page() {
	const params = useParams();
	const searchParams = useSearchParams();
	const entityId = Array.isArray(params.entityId)
		? params.entityId[0]
		: (params.entityId as string);

	const [input, setInput] = useState("");
	const [messages, setMessages] = useState<CoreMessage[]>([]);
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [entity, setEntity] = useState<Entity | undefined>();

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

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

	const handleSendMessage = async () => {
		if (!input.trim() || sending) return;

		try {
			setSending(true);

			const userMessage = { role: "user", content: input };
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
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to send message");
			}

			const { messages: newMessages } = await response.json();

			setMessages((currentMessages) => [
				...currentMessages,
				...newMessages.filter((msg) => msg.role === "assistant"),
			]);
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
			<Card className="border shadow-lg">
				<CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
					<div className="flex items-center gap-3">
						<Avatar className="h-10 w-10 border-2 border-white">
							<AvatarFallback className="bg-white text-blue-500 font-bold">
								{entity.name.charAt(0)}
							</AvatarFallback>
							{/* {entity.imageUrl && (
								<AvatarImage src={entity.imageUrl} alt={entity.name} />
							)} */}
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
												{/* {entity.imageUrl && (
													<AvatarImage
														src={entity.imageUrl}
														alt={entity.name}
													/>
												)} */}
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
														.filter((part) => part.type === "text")
														.map((part, partIndex) => (
															<div key={partIndex}>{part.text}</div>
														))}
										</div>
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
