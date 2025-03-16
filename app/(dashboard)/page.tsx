"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useEffect, useState } from "react";

// Define the Universe interface
interface Universe {
	id: string;
	name: string;
	description: string;
	status: string;
	entityCount?: number;
}

export default function HomePage() {
	const [universes, setUniverses] = useState<Universe[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchUniverses() {
			try {
				const response = await fetch("/api/universes");
				if (!response.ok) {
					throw new Error("Failed to fetch universes");
				}
				const data = await response.json();
				setUniverses(data);
			} catch (err: any) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		}

		fetchUniverses();
	}, []);

	if (loading)
		return <div className="p-8 text-center">Loading universes...</div>;
	if (error)
		return <div className="p-8 text-center text-red-500">Error: {error}</div>;

	return (
		<div className="container mx-auto p-6">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold">Universe Manager</h1>
				<Link href="/universes/new">
					<Button>Create New Universe</Button>
				</Link>
			</div>

			{universes.length === 0 ? (
				<div className="text-center p-12 border rounded-lg">
					<h2 className="text-xl mb-4">No universes found</h2>
					<p className="mb-6">Start by creating your first universe</p>
					<Link href="/universes/new">
						<Button>Create Universe</Button>
					</Link>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{universes.map((universe) => (
						<Card key={universe.id} className="flex flex-col">
							<CardHeader>
								<CardTitle>{universe.name}</CardTitle>
								<CardDescription>{universe.description}</CardDescription>
							</CardHeader>
							<CardContent className="flex-grow">
								<Badge className="mb-2">{universe.status}</Badge>
								<p className="text-sm mt-2">
									Entities: {universe.entityCount || 0}
								</p>
							</CardContent>
							<CardFooter className="flex justify-between">
								<Link href={`/universes/${universe.id}`}>
									<Button variant="outline">View</Button>
								</Link>
								<Link href={`/universes/${universe.id}/edit`}>
									<Button variant="outline">Edit</Button>
								</Link>
							</CardFooter>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
