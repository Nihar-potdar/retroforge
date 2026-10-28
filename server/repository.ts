import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import type { SavedBuild, BUILD } from "../src/data/type";

export interface BuildRepository {
  list(userId: string): Promise<SavedBuild[]>;
  create(userId: string, input: { name: string; build: BUILD }): Promise<SavedBuild>;
  remove(userId: string, id: string): Promise<boolean>;
  import(userId: string, builds: SavedBuild[]): Promise<number>;
}

export function createRepository(databaseUrl: string): BuildRepository {
  const sql = neon(databaseUrl);
  return {
    async list(userId) {
      return await sql`SELECT id, name, build FROM saved_builds WHERE user_id = ${userId} ORDER BY created_at, id` as SavedBuild[];
    },
    async create(userId, input) {
      const id = randomUUID();
      await sql`INSERT INTO saved_builds (id, user_id, name, build) VALUES (${id}, ${userId}, ${input.name}, ${JSON.stringify(input.build)}::jsonb)`;
      return { id, ...input };
    },
    async remove(userId, id) {
      const rows = await sql`DELETE FROM saved_builds WHERE id = ${id}::uuid AND user_id = ${userId} RETURNING id`;
      return rows.length > 0;
    },
    async import(userId, builds) {
      const results = await sql.transaction(builds.map(build => sql`
        INSERT INTO saved_builds (id, user_id, name, build, source_id)
        VALUES (${randomUUID()}, ${userId}, ${build.name}, ${JSON.stringify(build.build)}::jsonb, ${build.id})
        ON CONFLICT (user_id, source_id) DO NOTHING RETURNING id`));
      return results.reduce((count, rows) => count + rows.length, 0);
    },
  };
}
