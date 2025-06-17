"use client";

import { KnowledgeSourcesWidget } from "@/components/knowledge-sources-widget";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { useUser } from "@/lib/auth";
import { KnowledgeSource } from "@/lib/chat/prompt";
import { cn } from "@/lib/utils";
import {
	AlertTriangle,
	Bot,
	ChevronDown,
	ChevronRight,
	Clock,
	Loader2,
	Send,
	Trash2,
	User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Timings {
	total: number;
	botFetch: number;
	knowledgeSearch: number;
	genAIGeneration: number;
}

interface ModerationResult {
	toxicityScore: number;
	harassmentScore: number;
	sexualContentScore: number;
	spamScore: number;
	violation: boolean;
}

interface Message {
	id: string;
	content: string;
	role: "user" | "assistant";
	timestamp: Date;
	knowledgeSources?: KnowledgeSource[];
	timings?: Timings;
	prompt?: string;
	isModerationWarning?: boolean;
	moderationResult?: ModerationResult;
}

interface ChatInterfaceProps {
	botId: string;
	botName: string;
}

function TimingBreakdown({ timings }: { timings: Timings }) {
	const [isOpen, setIsOpen] = useState(false);
	const { userPromise } = useUser();
	const [shouldShow, setShouldShow] = useState(false);

	useEffect(() => {
		userPromise.then((user) => {
			if (
				user?.email === "chad.brogrammer@gmail.com" ||
				user?.email === "dosterz97@gmail.com"
			) {
				setShouldShow(true);
			}
		});
	}, [userPromise]);

	if (!shouldShow) return null;

	const formatTime = (ms: number) => {
		if (ms >= 1000) {
			return `${(ms / 1000).toFixed(2)}s`;
		}
		return `${Math.round(ms)}ms`;
	};

	const getPercentage = (ms: number) => {
		const total =
			timings.botFetch + timings.knowledgeSearch + timings.genAIGeneration;
		return ((ms / total) * 100).toFixed(1);
	};

	return (
		<Card className="mt-2 bg-slate-50/50 border-slate-200">
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<CollapsibleTrigger asChild>
					<CardHeader className="pb-2 pt-3 px-3 cursor-pointer hover:bg-slate-100/50 transition-colors">
						<CardTitle className="text-xs font-medium text-slate-700 flex items-center gap-2">
							<Clock className="h-3 w-3" />
							Performance Breakdown (
							{formatTime(
								timings.botFetch +
									timings.knowledgeSearch +
									timings.genAIGeneration
							)}
							)
							{isOpen ? (
								<ChevronDown className="h-3 w-3" />
							) : (
								<ChevronRight className="h-3 w-3" />
							)}
						</CardTitle>
					</CardHeader>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<CardContent className="pt-0 px-3 pb-3">
						<div className="space-y-1">
							<div className="flex justify-between items-center">
								<span className="text-muted-foreground">Bot Fetch:</span>
								<div className="flex items-center gap-2">
									<div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
										<div
											className="h-full bg-blue-500"
											style={{ width: `${getPercentage(timings.botFetch)}%` }}
										/>
									</div>
									<span className="font-mono w-12 text-right text-xs">
										{formatTime(timings.botFetch)}
									</span>
								</div>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-muted-foreground">Knowledge Search:</span>
								<div className="flex items-center gap-2">
									<div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
										<div
											className="h-full bg-green-500"
											style={{
												width: `${getPercentage(timings.knowledgeSearch)}%`,
											}}
										/>
									</div>
									<span className="font-mono w-12 text-right text-xs">
										{formatTime(timings.knowledgeSearch)}
									</span>
								</div>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-muted-foreground">
									Gemini Generation:
								</span>
								<div className="flex items-center gap-2">
									<div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
										<div
											className="h-full bg-purple-500"
											style={{
												width: `${getPercentage(timings.genAIGeneration)}%`,
											}}
										/>
									</div>
									<span className="font-mono w-12 text-right text-xs">
										{formatTime(timings.genAIGeneration)}
									</span>
								</div>
							</div>
						</div>
					</CardContent>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
}

function PromptViewer({ prompt }: { prompt: string }) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Card className="mt-2 bg-orange-50/50 border-orange-200">
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<CollapsibleTrigger asChild>
					<CardHeader className="pb-2 pt-3 px-3 cursor-pointer hover:bg-orange-100/50 transition-colors">
						<CardTitle className="text-xs font-medium text-orange-700 flex items-center gap-2">
							<Bot className="h-3 w-3" />
							Gemini Input Prompt
							{isOpen ? (
								<ChevronDown className="h-3 w-3" />
							) : (
								<ChevronRight className="h-3 w-3" />
							)}
						</CardTitle>
					</CardHeader>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<CardContent className="pt-0 px-3 pb-3">
						<pre className="text-xs text-gray-700 whitespace-pre-wrap bg-white border border-orange-200 rounded-md p-3 max-h-96 overflow-y-auto">
							{prompt}
						</pre>
					</CardContent>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
}

function ModerationDetails({ result }: { result: ModerationResult }) {
	const [isOpen, setIsOpen] = useState(false);

	const categories = [
		{ name: "Toxicity", score: result.toxicityScore },
		{ name: "Harassment", score: result.harassmentScore },
		{ name: "Sexual Content", score: result.sexualContentScore },
		{ name: "Spam", score: result.spamScore },
	];

	return (
		<Card
			className={cn(
				"mt-2 border",
				result.violation
					? "bg-red-50/50 border-red-200"
					: "bg-slate-50/50 border-slate-200"
			)}
		>
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<CollapsibleTrigger asChild>
					<CardHeader className="pb-2 pt-3 px-3 cursor-pointer hover:bg-slate-100/50 transition-colors">
						<CardTitle
							className={cn(
								"text-xs font-medium flex items-center gap-2",
								result.violation ? "text-red-700" : "text-slate-700"
							)}
						>
							<AlertTriangle className="h-3 w-3" />
							Content Moderation Scores
							{isOpen ? (
								<ChevronDown className="h-3 w-3" />
							) : (
								<ChevronRight className="h-3 w-3" />
							)}
						</CardTitle>
					</CardHeader>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<CardContent className="pt-0 px-3 pb-3">
						<div className="space-y-1">
							{categories.map(({ name, score }) => (
								<div
									key={name}
									className="flex justify-between items-center mb-1"
								>
									<span className="text-muted-foreground text-xs">{name}:</span>
									<div className="flex items-center gap-2">
										<div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
											<div
												className={cn(
													"h-full",
													result.violation ? "bg-red-500" : "bg-slate-500"
												)}
												style={{ width: `${(score * 100).toFixed(1)}%` }}
											/>
										</div>
										<span
											className={cn(
												"font-mono w-12 text-right text-xs",
												result.violation ? "text-red-700" : "text-slate-700"
											)}
										>
											{(score * 100).toFixed(1)}%
										</span>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
}

export function ChatInterface({ botId, botName }: ChatInterfaceProps) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Local storage key for this bot's chat history
	const chatStorageKey = `chat-history-${botId}`;

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Load chat history from local storage on component mount
	useEffect(() => {
		try {
			const savedMessages = localStorage.getItem(chatStorageKey);
			if (savedMessages) {
				const parsedMessages = JSON.parse(savedMessages);
				setMessages(parsedMessages);
			}
		} catch (error) {
			console.error("Error loading chat history:", error);
		}
	}, [chatStorageKey]);

	// Save chat history to local storage whenever messages change
	useEffect(() => {
		if (messages.length > 0) {
			try {
				localStorage.setItem(chatStorageKey, JSON.stringify(messages));
			} catch (error) {
				console.error("Error saving chat history:", error);
			}
		}
	}, [messages, chatStorageKey]);

	// Convert messages to chat history format for API
	const getChatHistory = () => {
		return messages
			.filter((msg) => msg.role === "user" || msg.role === "assistant")
			.map((msg) => ({
				role: msg.role,
				content: msg.content,
			}))
			.slice(-20); // Limit to last 20 messages
	};

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
			const chatHistory = getChatHistory();

			const response = await fetch(`/api/bots/${botId}/chat`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					message: input,
					chatHistory: chatHistory,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				// Handle moderation error
				if (response.status === 400 && data.moderationResult) {
					const errorMessage: Message = {
						id: (Date.now() + 1).toString(),
						content: data.error,
						role: "assistant",
						timestamp: new Date(),
						isModerationWarning: true,
						moderationResult: data.moderationResult,
					};
					setMessages((prev) => [...prev, errorMessage]);
					return;
				}
				throw new Error(data.error || "Failed to get response");
			}

			const assistantMessage: Message = {
				id: (Date.now() + 1).toString(),
				content: data.response,
				role: "assistant",
				timestamp: new Date(),
				knowledgeSources: data.knowledgeSources || undefined,
				timings: data.timings || undefined,
				prompt: data.prompt || undefined,
				moderationResult: data.moderationResult || undefined,
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

	// Clear chat history
	const clearChatHistory = () => {
		setMessages([]);
		try {
			localStorage.removeItem(chatStorageKey);
		} catch (error) {
			console.error("Error clearing chat history:", error);
		}
	};

	return (
		<Card className="h-[600px] flex flex-col">
			<CardHeader className="flex-shrink-0">
				<CardTitle className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Bot className="h-5 w-5" />
						Chat with {botName}
					</div>
					{messages.length > 0 && (
						<Button
							variant="ghost"
							size="sm"
							onClick={clearChatHistory}
							className="text-muted-foreground hover:text-destructive"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent className="flex-1 flex flex-col p-0 min-h-0">
				<div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
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
								<Avatar className="h-8 w-8 flex-shrink-0">
									<AvatarFallback>
										<Bot className="h-4 w-4" />
									</AvatarFallback>
								</Avatar>
							)}
							<div
								className={cn(
									"max-w-[80%] flex-shrink",
									message.role === "user"
										? "flex flex-col items-end"
										: "flex flex-col items-start"
								)}
							>
								<div
									className={cn(
										"p-3 rounded-lg text-sm break-words",
										message.role === "user"
											? "bg-primary text-primary-foreground"
											: message.isModerationWarning
											? "bg-destructive/10 text-destructive border border-destructive/20"
											: "bg-muted"
									)}
								>
									{message.content}
								</div>
								{message.role === "assistant" && message.knowledgeSources && (
									<div className="w-full mt-2">
										<KnowledgeSourcesWidget
											sources={message.knowledgeSources}
										/>
									</div>
								)}
								{message.role === "assistant" && message.timings && (
									<div className="w-full">
										<TimingBreakdown timings={message.timings} />
									</div>
								)}
								{message.role === "assistant" && message.prompt && (
									<div className="w-full">
										<PromptViewer prompt={message.prompt} />
									</div>
								)}
								{message.role === "assistant" && message.moderationResult && (
									<div className="w-full">
										<ModerationDetails result={message.moderationResult} />
									</div>
								)}
							</div>
							{message.role === "user" && (
								<Avatar className="h-8 w-8 flex-shrink-0">
									<AvatarFallback>
										<User className="h-4 w-4" />
									</AvatarFallback>
								</Avatar>
							)}
						</div>
					))}
					{isLoading && (
						<div className="flex gap-3">
							<Avatar className="h-8 w-8 flex-shrink-0">
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
				<div className="border-t p-4 flex-shrink-0">
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
