import { config } from 'dotenv';
import type { NextConfig } from "next";
import path from 'path';

// Load environment variables from root .env file
config({ path: path.resolve(process.cwd(), '../../.env') });

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				hostname: "avatar.vercel.sh",
			},
		],
	},
	env: {
		AUTH_SECRET: process.env.AUTH_SECRET,
		POSTGRES_URL: process.env.POSTGRES_URL,
		NEXTAUTH_URL: process.env.NEXTAUTH_URL,
		NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
		OPENAI_API_KEY: process.env.OPENAI_API_KEY,
		STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
		STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
		NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
		QDRANT_URL: process.env.QDRANT_URL,
		QDRANT_API_KEY: process.env.QDRANT_API_KEY,
		VERCEL_BLOB_READ_WRITE_TOKEN: process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
	},
};

export default nextConfig;
