import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { generateKeyPairSync, sign } from "node:crypto";
import { clerkMiddleware } from "@clerk/express";
import { createApp } from "../server/app";
import type { BuildRepository } from "../server/repository";

function repository(): BuildRepository {
  return { list: vi.fn(async () => []), create: vi.fn(async (_owner, input) => ({ id: "5601a2e3-9fa7-4e1d-8f19-9855ece67831", ...input })), remove: vi.fn(async () => false), import: vi.fn(async () => 0) };
}
function appFor(repo = repository()) {
  return createApp({ repository: repo, authenticate: (_req, _res, next) => next(), userId: req => req.header("test-user") ?? null });
}

describe("independent API boundary audit (injected test identity)", () => {
  it("rejects anonymous requests to each exact protected route before repository access", async () => {
    const repo = repository();
    const app = appFor(repo);
    for (const [method, path] of [["get", "/api/builds"], ["post", "/api/builds"], ["post", "/api/builds/import"], ["delete", "/api/builds/5601a2e3-9fa7-4e1d-8f19-9855ece67831"]] as const) {
      expect((await request(app)[method](path)).status).toBe(401);
    }
    for (const method of Object.values(repo)) expect(method).not.toHaveBeenCalled();
  });
  it("ignores spoofed owner and IDs, trims names, and sends only parsed input to persistence", async () => {
    const repo = repository();
    const response = await request(appFor(repo)).post("/api/builds").set("test-user", "alice").send({ id: "attacker-id", userId: "bob", user_id: "bob", name: "  My PC  ", build: { STORAGE: [], injected: true } });
    expect(response.status).toBe(201);
    expect(repo.create).toHaveBeenCalledWith("alice", { name: "My PC", build: { STORAGE: [] } });
    expect(response.headers["cache-control"]).toBe("no-store");
  });
  it("rejects form and text cross-origin write payloads without touching persistence", async () => {
    const repo = repository();
    const app = appFor(repo);
    for (const type of ["text/plain", "application/x-www-form-urlencoded"]) {
      const response = await request(app).post("/api/builds").set("test-user", "alice").set("Origin", "https://attacker.example").set("Content-Type", type).send('{"name":"Forged","build":{"STORAGE":[]}}');
      expect(response.status).toBe(400);
      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    }
    expect(repo.create).not.toHaveBeenCalled();
  });
  it("rejects invalid IDs and empty, excessive, or partially invalid imports atomically at validation", async () => {
    const repo = repository();
    const app = appFor(repo);
    expect((await request(app).delete("/api/builds/not-a-uuid").set("test-user", "alice")).status).toBe(404);
    const valid = { id: "local-1", name: "PC", build: { STORAGE: [] } };
    for (const builds of [[], Array.from({ length: 101 }, () => valid), [valid, { ...valid, build: {} }], [{ ...valid, name: "x".repeat(121) }]]) {
      expect((await request(app).post("/api/builds/import").set("test-user", "alice").send({ builds })).status).toBe(400);
    }
    expect(repo.remove).not.toHaveBeenCalled();
    expect(repo.import).not.toHaveBeenCalled();
  });
  it("does not expose database exception details in error responses", async () => {
    const repo = repository();
    vi.mocked(repo.list).mockRejectedValue(new Error("postgresql://user:secret@example/private internal SQL"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await request(appFor(repo)).get("/api/builds").set("test-user", "alice");
      expect(response.status).toBe(500);
      expect(JSON.stringify(response.body)).not.toMatch(/secret|postgresql|SQL/);
      expect(response.headers["cache-control"]).toBe("no-store");
      expect(JSON.stringify(log.mock.calls)).not.toContain("secret");
    } finally { log.mockRestore(); }
  });
});

describe("independent real Clerk verifier audit (local signing key; no live Clerk account)", () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const issuer = "https://retroforge-audit.clerk.accounts.dev";
  function jwt(extra: Record<string, unknown> = {}, alg = "RS256") {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg, typ: "JWT", kid: "audit" })).toString("base64url");
    const body = Buffer.from(JSON.stringify({ iss: issuer, sub: "user_alice", sid: "sess_audit", iat: now, nbf: now - 5, exp: now + 300, azp: "http://localhost:5173", v: 2, sts: "active", fva: [0, -1], ...extra })).toString("base64url");
    return `${header}.${body}.${sign("RSA-SHA256", Buffer.from(`${header}.${body}`), privateKey).toString("base64url")}`;
  }
  function verifiedApp() {
    const repo = repository();
    return { repo, app: createApp({ repository: repo, authenticate: clerkMiddleware({ publishableKey: `pk_test_${Buffer.from("retroforge-audit.clerk.accounts.dev$").toString("base64")}`, secretKey: "sk_test_audit_not_real", jwtKey: publicKey.export({ type: "spki", format: "pem" }).toString(), authorizedParties: ["http://localhost:5173"] }) }) };
  }
  it("fails closed for malformed bearer tokens and unsigned algorithms", async () => {
    const { app, repo } = verifiedApp();
    for (const token of ["garbage", "a.b.c", jwt({}, "none"), jwt().split(".").slice(0, 2).join(".") + "."]) {
      expect((await request(app).get("/api/builds").set("Authorization", `Bearer ${token}`)).status).toBe(401);
    }
    expect(repo.list).not.toHaveBeenCalled();
  });
  it("rejects future-not-before, pending sessions, and missing user identity", async () => {
    const { app, repo } = verifiedApp();
    for (const extra of [{ nbf: Math.floor(Date.now() / 1000) + 3600 }, { sts: "pending" }, { sub: "" }]) {
      expect((await request(app).get("/api/builds").set("Authorization", `Bearer ${jwt(extra)}`)).status).toBe(401);
    }
    expect(repo.list).not.toHaveBeenCalled();
  });
});
