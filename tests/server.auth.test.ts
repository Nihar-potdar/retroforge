import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { createApp } from "../server/app.js";
import type { BuildRepository } from "../server/repository.js";
import type { SavedBuild } from "../src/data/type.js";

function fixture() {
  const rows = new Map<string, SavedBuild[]>();
  const imported = new Set<string>();
  const repository: BuildRepository = {
    async list(owner) { return rows.get(owner) ?? []; },
    async create(owner, input) {
      const saved = { id: randomUUID(), ...input };
      rows.set(owner, [...(rows.get(owner) ?? []), saved]);
      return saved;
    },
    async remove(owner, id) {
      const previous = rows.get(owner) ?? [];
      rows.set(owner, previous.filter(row => row.id !== id));
      return rows.get(owner)!.length !== previous.length;
    },
    async import(owner, builds) {
      let count = 0;
      for (const saved of builds) {
        const key = `${owner}:${saved.id}`;
        if (imported.has(key)) continue;
        await repository.create(owner, saved);
        imported.add(key); count++;
      }
      return count;
    },
  };
  return createApp({ repository, authenticate: (_req, _res, next) => next(), userId: req => req.header("test-user") ?? null });
}

describe("authenticated saved-build API", () => {
  let app: ReturnType<typeof fixture>;
  beforeEach(() => { app = fixture(); });
  it("rejects anonymous list/create/delete/import requests", async () => {
    for (const method of ["get", "post", "delete"] as const) {
      expect((await request(app)[method]("/api/builds")).status).toBe(401);
    }
    expect((await request(app).post("/api/builds/import")).status).toBe(401);
  });
  it("derives the owner from the verified session and isolates accounts", async () => {
    const created = await request(app).post("/api/builds").set("test-user", "alice").send({ userId: "bob", name: "My PC", build: { STORAGE: [] } });
    expect(created.status).toBe(201);
    expect((await request(app).get("/api/builds").set("test-user", "bob")).body).toEqual([]);
    expect((await request(app).delete(`/api/builds/${created.body.id}`).set("test-user", "bob")).status).toBe(404);
    const list = await request(app).get("/api/builds").set("test-user", "alice");
    expect(list.headers["cache-control"]).toBe("no-store");
    expect(list.body).toEqual([created.body]);
    expect((await request(app).delete(`/api/builds/${created.body.id}`).set("test-user", "alice")).status).toBe(204);
    expect((await request(app).get("/api/builds").set("test-user", "alice")).body).toEqual([]);
  });
  it("rejects malformed data, JSON, and oversized bodies", async () => {
    for (const body of [{ name: " ", build: { STORAGE: [] } }, { name: "x".repeat(121), build: { STORAGE: [] } }, { name: "PC", build: {} }]) {
      expect((await request(app).post("/api/builds").set("test-user", "alice").send(body)).status).toBe(400);
    }
    expect((await request(app).post("/api/builds").set("test-user", "alice").set("Content-Type", "application/json").send("{")).status).toBe(400);
    expect((await request(app).post("/api/builds").set("test-user", "alice").send({ name: "x".repeat(1_100_000) })).status).toBe(413);
  });
  it("imports explicitly and returns retry counts scoped to each account", async () => {
    const builds = [{ id: "browser-1", name: "Local PC", build: { STORAGE: [] } }];
    const first = await request(app).post("/api/builds/import").set("test-user", "alice").send({ builds });
    expect(first.body).toEqual({ imported: 1, skipped: 0 });
    expect((await request(app).post("/api/builds/import").set("test-user", "alice").send({ builds })).body).toEqual({ imported: 0, skipped: 1 });
    expect((await request(app).post("/api/builds/import").set("test-user", "bob").send({ builds })).body).toEqual({ imported: 1, skipped: 0 });
  });
});

// Exercise the real Clerk verifier with a local test signing key, without a Clerk account.
describe("Clerk session verification", () => {
  it("accepts signed sessions and rejects forged, expired, and wrong-origin tokens", async () => {
    const { generateKeyPairSync, sign } = await import("node:crypto");
    const { clerkMiddleware } = await import("@clerk/express");
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const issuer = "https://retroforge-test.clerk.accounts.dev";
    const publishableKey = `pk_test_${Buffer.from("retroforge-test.clerk.accounts.dev$").toString("base64")}`;
    const authenticate = clerkMiddleware({ publishableKey, secretKey: "sk_test_not_a_real_secret", jwtKey: publicKey.export({ type: "spki", format: "pem" }).toString(), authorizedParties: ["http://localhost:5173"] });
    let observedOwner = "";
    const app = createApp({ authenticate, repository: {
      list: async owner => { observedOwner = owner; return []; },
      create: async () => { throw new Error("unused"); },
      remove: async () => false,
      import: async () => 0,
    } });
    function jwt(extra: Record<string, unknown> = {}) {
      const now = Math.floor(Date.now() / 1000);
      const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT", kid: "test" })).toString("base64url");
      const body = Buffer.from(JSON.stringify({ iss: issuer, sub: "user_alice", sid: "sess_test", iat: now, nbf: now - 5, exp: now + 300, azp: "http://localhost:5173", v: 2, sts: "active", fva: [0, -1], ...extra })).toString("base64url");
      return `${header}.${body}.${sign("RSA-SHA256", Buffer.from(`${header}.${body}`), privateKey).toString("base64url")}`;
    }
    const valid = await request(app).get("/api/builds").set("Authorization", `Bearer ${jwt()}`);
    expect(valid.status).toBe(200);
    expect(observedOwner).toBe("user_alice");
    for (const token of [jwt({ exp: 1 }), jwt({ azp: "https://untrusted.example" }), `${jwt().split(".").slice(0, 2).join(".")}.forged`]) {
      expect((await request(app).get("/api/builds").set("Authorization", `Bearer ${token}`)).status).toBe(401);
    }
  });
});
