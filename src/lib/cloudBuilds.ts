import { savedBuildListSchema, savedBuildSchema } from "../zod/buildSchema";
import type { BUILD, SavedBuild } from "../data/type";

export function cloudBuilds(getToken: () => Promise<string | null>, signal?: AbortSignal) {
  async function request(path = "", method = "GET", body?: unknown) {
    const token = await getToken();
    if (!token) throw new Error("Your session expired. Sign in again to access cloud saves.");
    const response = await fetch(`/api/builds${path}`, { method, signal,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const value = await response.json().catch(() => ({}));
      throw new Error(typeof value.error === "string" ? value.error : "Cloud saves are unavailable. Please retry.");
    }
    return response.status === 204 ? undefined : response.json();
  }
  return {
    list: async () => savedBuildListSchema.parse(await request()),
    save: async (name: string, build: BUILD) => savedBuildSchema.parse(await request("", "POST", { name, build })),
    remove: async (id: string) => { await request(`/${encodeURIComponent(id)}`, "DELETE"); },
    import: async (builds: SavedBuild[]) => {
      const result = await request("/import", "POST", { builds });
      return result as { imported: number; skipped: number };
    },
  };
}
