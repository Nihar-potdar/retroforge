import { z } from "zod";
import { buildSchema, savedBuildSchema } from "./buildSchema";

export const createBuildSchema = z.object({
  name: z.string().trim().min(1).max(120),
  build: buildSchema,
});
export const importBuildsSchema = z.object({
  builds: z.array(savedBuildSchema.extend({ name: z.string().trim().min(1).max(120) })).min(1).max(100),
});
