"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function HomePage() {
	const router = useRouter();
	return (
		<div className="container mx-auto p-6">
			<h1>Home</h1>
			<Button
				onClick={() => {
					router.push("/dashboard/universes");
				}}
			>
				My Universes
			</Button>
		</div>
	);
}
