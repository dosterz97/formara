"use client";

import ChatInterface from "@/components/chat/chat-interface";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Entity, Universe } from "@/lib/db/schema";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Page() {
	const params = useParams();
	const entityId = Array.isArray(params.entityId)
		? params.entityId[0]
		: (params.entityId as string);

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [entity, setEntity] = useState<Entity | undefined>();
	const [universe, setUniverse] = useState<Universe | undefined>();
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
			<div className="absolute inset-0">
				<audio ref={audioRef} className="hidden" controls />
				<ChatInterface
					entity={entity}
					universe={universe}
					audioRef={audioRef}
				/>
			</div>
		</>
	);
}
