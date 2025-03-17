"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

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

	return (
		<div className="container mx-auto p-6">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold">Home</h1>
				<Link href="/universes/new">
					<Button>Create New Universe</Button>
				</Link>
			</div>
		</div>
	);
}
