"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Entity } from "@/lib/db/schema";
import { CoreMessage } from "ai";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
	const params = useParams();
	const searchParams = useSearchParams();
	const entityId = Array.isArray(params.entityId)
		? params.entityId[0]
		: (params.entityId as string);
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState<CoreMessage[]>([]);

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [entity, setEntity] = useState<Entity | undefined>();

	// Fetch entity data
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

	if (!entity) {
		return <div>Loading</div>;
	}

	return (
		<div className="max-w-5xl mx-auto">
			<Label>Chat with {entity?.name}</Label>
			<Input
				value={input}
				onChange={(event) => {
					setInput(event.target.value);
				}}
				onKeyDown={async (event) => {
					if (event.key === "Enter") {
						setMessages((currentMessages) => [
							...currentMessages,
							{ role: "user", content: input },
						]);

						const response = await fetch(`/api/chat/${entity.id}`, {
							method: "POST",
							body: JSON.stringify({
								messages: [...messages, { role: "user", content: input }],
							}),
						});

						const { messages: newMessages } = await response.json();

						setMessages((currentMessages) => [
							...currentMessages,
							...newMessages,
						]);
					}
				}}
			/>
			{messages.map((message, index) => (
				<div key={`${message.role}-${index}`}>
					{typeof message.content === "string"
						? message.content
						: message.content
								.filter((part) => part.type === "text")
								.map((part, partIndex) => (
									<div key={partIndex}>{part.text}</div>
								))}
				</div>
			))}
		</div>
	);
}
