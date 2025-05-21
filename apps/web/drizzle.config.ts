import dotenv from "dotenv";
import type { Config } from "drizzle-kit";

dotenv.config({ path: "../../.env" });

export default {
	schema: "./lib/db/schema.ts",
	out: "./lib/db/migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.POSTGRES_URL!,
	},
} satisfies Config;
