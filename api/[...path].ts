import express from "express";
import { createApp } from "../server/app.js";
import { createRepository } from "../server/repository.js";

const handler = express();
let application: ReturnType<typeof createApp> | undefined;
handler.use((req, res, next) => {
  if (!process.env.DATABASE_URL || !process.env.CLERK_SECRET_KEY || !process.env.CLERK_PUBLISHABLE_KEY || !process.env.CLERK_AUTHORIZED_PARTIES) {
    res.status(503).json({ error: "Cloud saves have not been configured. Browser saves remain available when signed out." });
    return;
  }
  application ??= createApp({ repository: createRepository(process.env.DATABASE_URL) });
  application(req, res, next);
});
export default handler;
