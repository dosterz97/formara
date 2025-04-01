// drop-tables.js
import dotenv from "dotenv";
import { sql } from "drizzle-orm";
import { db } from "./drizzle";

dotenv.config();

async function resetAllTables() {
	try {
		console.log("Starting full database reset...");

		// Get all tables in the current schema (public by default)
		const tablesResult = await db.execute(sql`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `);

		// Extract table names from result
		const tables = tablesResult.map((row) => row.tablename);
		console.log("Found tables:", tables);

		// Drop all tables using properly escaped identifiers
		for (const table of tables) {
			console.log(`Dropping table: ${table}`);
			// Use the sql identifier template for table names
			const dropQuery = sql`DROP TABLE IF EXISTS ${sql.identifier(
				table as string
			)} CASCADE`;
			await db.execute(dropQuery);
		}

		console.log("All tables have been dropped successfully!");

		process.exit(0);
	} catch (error) {
		console.error("Error during database reset:", error);
		process.exit(1);
	}
}

resetAllTables();
