#!/usr/bin/env node
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const backendRoot = path.join(__dirname, "..");
dotenv.config({ path: path.join(backendRoot, ".env") });
dotenv.config({ path: path.join(backendRoot, ".env.local") });

(async () => {
  try {
    const sqlDir = path.join(__dirname, "..", "sql");
    const files = fs.existsSync(sqlDir)
      ? fs
          .readdirSync(sqlDir)
          .filter(f => f.endsWith(".sql"))
          .sort()
      : [];

    if (files.length === 0) {
      console.log("No SQL files found in", sqlDir);
      process.exit(0);
    }

    const connectionString =
      process.env.DATABASE_URL ||
      process.env.SUPABASE_DB_URL ||
      process.env.SUPABASE_DATABASE_URL;
    if (!connectionString) {
      console.error(
        "Missing database connection string. Set DATABASE_URL (or SUPABASE_DB_URL / SUPABASE_DATABASE_URL) in your environment before running migrations.",
      );
      process.exit(1);
    }

    const client = new Client({ connectionString });
    await client.connect();

    for (const file of files) {
      const filePath = path.join(sqlDir, file);
      console.log("Running migration:", filePath);
      const sql = fs.readFileSync(filePath, "utf8");
      await client.query(sql);
    }

    await client.end();
    console.log("Migrations complete");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
})();
