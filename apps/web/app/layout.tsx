import type { Metadata, Viewport } from "next";

import { Toaster } from "@/components/ui/sonner";
import { UserProvider } from "@/lib/auth";
import { getUser } from "@/lib/db/queries";
import { GoogleTagManager } from "@next/third-parties/google";
import Script from "next/script";

import { Manrope } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
	title: "Formorra",
	description: "Create universes that matter.",
};

export const viewport: Viewport = {
	maximumScale: 1,
};

const manrope = Manrope({ subsets: ["latin"] });

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	let userPromise = getUser();

	return (
		<html
			lang="en"
			className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
		>
			{/* Google tag (gtag.js) */}
			<Script
				async
				src="https://www.googletagmanager.com/gtag/js?id=AW-17267419988"
			/>
			<Script id="google-analytics">
				{`
					window.dataLayer = window.dataLayer || [];
					function gtag(){dataLayer.push(arguments);}
					gtag('js', new Date());
					gtag('config', 'AW-17267419988');
				`}
			</Script>
			<body className="min-h-[100dvh] bg-gray-50">
				<UserProvider userPromise={userPromise}>{children}</UserProvider>
				<Toaster richColors />
			</body>
			<GoogleTagManager gtmId="AW-17041494526" />
		</html>
	);
}
