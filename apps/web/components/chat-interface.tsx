"use client";

import { KnowledgeSourcesWidget } from "@/components/knowledge-sources-widget";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Bot, Loader2, Send, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface KnowledgeSource {
	name: string;
	content: string;
	score: number;
}

interface Message {
	id: string;
	content: string;
	role: "user" | "assistant";
	timestamp: Date;
	knowledgeSources?: KnowledgeSource[];
}

interface ChatInterfaceProps {
	botId: string;
	botName: string;
}

export function ChatInterface({ botId, botName }: ChatInterfaceProps) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() || isLoading) return;

		const userMessage: Message = {
			id: Date.now().toString(),
			content: input,
			role: "user",
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setIsLoading(true);

		try {
			const response = await fetch(`/api/bots/${botId}/chat`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ message: input }),
			});

			if (!response.ok) {
				throw new Error("Failed to get response");
			}

			const data = await response.json();

			const assistantMessage: Message = {
				id: (Date.now() + 1).toString(),
				content: data.response,
				role: "assistant",
				timestamp: new Date(),
				knowledgeSources: data.knowledgeSources || undefined,
			};

			setMessages((prev) => [...prev, assistantMessage]);
		} catch (error) {
			console.error("Error sending message:", error);
			const errorMessage: Message = {
				id: (Date.now() + 1).toString(),
				content: "Sorry, I encountered an error. Please try again.",
				role: "assistant",
				timestamp: new Date(),
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card className="h-[600px] flex flex-col">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Bot className="h-5 w-5" />
					Chat with {botName}
				</CardTitle>
			</CardHeader>
			<CardContent className="flex-1 flex flex-col p-0">
				<div className="flex-1 overflow-y-auto p-4 space-y-4">
					{messages.length === 0 && (
						<div className="text-center text-muted-foreground py-8">
							Start a conversation to test the bot's knowledge base!
						</div>
					)}
					{messages.map((message) => (
						<div
							key={message.id}
							className={cn(
								"flex gap-3",
								message.role === "user" ? "justify-end" : "justify-start"
							)}
						>
							{message.role === "assistant" && (
								<Avatar className="h-8 w-8">
									<AvatarFallback>
										<Bot className="h-4 w-4" />
									</AvatarFallback>
								</Avatar>
							)}
							<div
								className={cn(
									"max-w-[80%]",
									message.role === "user"
										? "flex flex-col items-end"
										: "flex flex-col items-start"
								)}
							>
								<div
									className={cn(
										"p-3 rounded-lg text-sm",
										message.role === "user"
											? "bg-primary text-primary-foreground"
											: "bg-muted"
									)}
								>
									{message.content}
								</div>
								{message.role === "assistant" && message.knowledgeSources && (
									<div className="w-full">
										<KnowledgeSourcesWidget
											sources={message.knowledgeSources}
										/>
									</div>
								)}
							</div>
							{message.role === "user" && (
								<Avatar className="h-8 w-8">
									<AvatarFallback>
										<User className="h-4 w-4" />
									</AvatarFallback>
								</Avatar>
							)}
						</div>
					))}
					{isLoading && (
						<div className="flex gap-3">
							<Avatar className="h-8 w-8">
								<AvatarFallback>
									<Bot className="h-4 w-4" />
								</AvatarFallback>
							</Avatar>
							<div className="bg-muted p-3 rounded-lg">
								<Loader2 className="h-4 w-4 animate-spin" />
							</div>
						</div>
					)}
					<div ref={messagesEndRef} />
				</div>
				<div className="border-t p-4">
					<form onSubmit={handleSubmit} className="flex gap-2">
						<Input
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder="Type your message..."
							disabled={isLoading}
							className="flex-1"
						/>
						<Button type="submit" disabled={isLoading || !input.trim()}>
							{isLoading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Send className="h-4 w-4" />
							)}
						</Button>
					</form>
				</div>
			</CardContent>
		</Card>
	);
}
