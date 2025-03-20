"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
	const router = useRouter();
	return (
		<div className="container mx-auto p-6">
			<h1>CHAT</h1>
		</div>
	);
}
