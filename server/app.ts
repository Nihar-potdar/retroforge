import express from "express";
import { clerkMiddleware, getAuth } from "@clerk/express";
import { z } from "zod";
import { createBuildSchema, importBuildsSchema } from "../src/zod/cloudSchema.js";
import type { BuildRepository } from "./repository.js";

type Options = {
  repository: BuildRepository;
  authenticate?: express.RequestHandler;
  userId?: (req: express.Request) => string | null;
};

export function createApp({ repository, authenticate = clerkMiddleware({
  authorizedParties: process.env.CLERK_AUTHORIZED_PARTIES?.split(",").map(value => value.trim()).filter(Boolean),
}), userId = req => getAuth(req).userId }: Options) {
  const app = express();
  app.disable("x-powered-by");
  app.use("/api", authenticate, (req, res, next) => {
    const owner = userId(req);
    if (!owner) { res.status(401).json({ error: "Sign in to access cloud saves." }); return; }
    res.locals.owner = owner;
    res.set("Cache-Control", "no-store");
    next();
  }, express.json({ limit: "1mb" }));
  app.get("/api/builds", async (_req, res) => {
    res.json(await repository.list(res.locals.owner));
  });
  app.post("/api/builds", async (req, res) => {
    const result = createBuildSchema.safeParse(req.body);
    if (!result.success) { res.status(400).json({ error: "A valid build and a name of 1–120 characters are required." }); return; }
    res.status(201).json(await repository.create(res.locals.owner, result.data));
  });
  app.post("/api/builds/import", async (req, res) => {
    const result = importBuildsSchema.safeParse(req.body);
    if (!result.success) { res.status(400).json({ error: "Import requires 1–100 valid browser builds with names up to 120 characters." }); return; }
    const imported = await repository.import(res.locals.owner, result.data.builds);
    res.json({ imported, skipped: result.data.builds.length - imported });
  });
  app.delete("/api/builds/:id", async (req, res) => {
    const id = z.uuid().safeParse(req.params.id);
    if (!id.success || !await repository.remove(res.locals.owner, id.data)) {
      res.status(404).json({ error: "Build not found." }); return;
    }
    res.status(204).end();
  });
  app.use("/api", (_req, res) => { res.status(404).json({ error: "Endpoint not found." }); });
  const handleError: express.ErrorRequestHandler = (error, _req, res, _next) => {
    void _next; // Express identifies error middleware by its four parameters.
    const status = error.status === 413 ? 413 : error.type === "entity.parse.failed" ? 400 : 500;
    if (status === 500) console.error("Cloud save request failed", error instanceof Error ? error.name : "Unknown error");
    res.status(status).json({ error: status === 413 ? "Build data is too large." : status === 400 ? "Invalid JSON." : "Cloud saves are temporarily unavailable. Please retry." });
  };
  app.use(handleError);
  return app;
}
