import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL before running migrations.");
const sql = neon(process.env.DATABASE_URL);
const migration = await readFile(new URL("./migrations/001_saved_builds.sql", import.meta.url), "utf8");
await sql.transaction(migration.split(";").map(value => value.trim()).filter(Boolean).map(statement => sql.query(statement)));
console.log("Saved-builds migration applied.");
