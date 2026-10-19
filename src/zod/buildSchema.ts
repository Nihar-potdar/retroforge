import { z } from "zod";

export const basePartSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  image: z.string().trim().min(1),
  price: z.number().min(0),
});

export const cpuSchema = basePartSchema.extend({
  componentType: z.literal("CPU"),
  brand: z.enum(["AMD", "Intel"]),
  socket: z.string().trim().min(1),
  cores: z.number().int().positive(),
  threads: z.number().int().positive(),
  baseClock: z.number().positive(),
  boostClock: z.number().positive(),
  integratedGraphics: z.boolean(),
  tdp: z.number().positive(),
  maxPowerW: z.number().positive().optional(),
  performanceScore: z.number().min(0),
});

const storageSchema = basePartSchema.extend({
  componentType: z.literal("Storage"),
  connector: z.enum(["M.2", "SATA"]),
  protocol: z.enum(["NVMe", "SATA"]),
  storageType: z.enum(["SSD", "HDD"]),
  formFactor: z.enum(["M.2 2280", "2.5-inch", "3.5-inch"]),
  capacityGB: z.number().positive(),
  readSpeedMBps: z.number().min(0),
  writeSpeedMBps: z.number().min(0),
});

export const installedDriveSchema = z.object({
  instanceId: z.string().trim().min(1),
  product: storageSchema,
});

export const gpuSchema = basePartSchema.extend({
  componentType: z.literal("GPU"),
  brand: z.enum(["NVIDIA", "AMD"]),
  chipset: z.string().trim().min(1),
  vram: z.number().positive(),
  tdp: z.number().positive(),
  boardPowerW: z.number().positive().optional(),
  recommendedPsuW: z.number().nonnegative().optional(),
  length: z.number().positive(),
  performanceScore: z.number().min(0),
});

export const ramSchema = basePartSchema.extend({
  componentType: z.literal("RAM"),
  type: z.enum(["DDR4", "DDR5"]),
  capacity: z.number().positive(),
  speed: z.number().positive(),
  modules: z.string().trim().min(1),
  rgb: z.boolean(),
  casLatency: z.number().positive(),
});

export const psuSchema = basePartSchema.extend({
  componentType: z.literal("PSU"),
  wattage: z.number().positive(),
  efficiencyRating: z.enum([
    "80+ Bronze",
    "80+ Gold",
    "80+ Platinum",
    "80+ Titanium",
  ]),
  modularity: z.enum(["Non-Modular", "Semi-Modular", "Fully Modular"]),
  formFactor: z.enum(["ATX", "SFX"]),
});

export const caseSchema = basePartSchema.extend({
  componentType: z.literal("Case"),
  formFactor: z.enum(["ATX", "Micro ATX", "Mini ITX"]),
  maxGpuLength: z.number().positive(),
  maxCoolerHeight: z.number().positive(),
  radiatorSupport: z.string().trim().min(1),
  color: z.string().trim().min(1),
  rgb: z.boolean(),
  temperedGlass: z.boolean(),
});

export const motherboardSchema = basePartSchema.extend({
  componentType: z.literal("Motherboard"),
  socket: z.string().trim().min(1),
  chipset: z.string().trim().min(1),
  formFactor: z.enum(["ATX", "Micro ATX", "Mini ITX"]),
  ramType: z.enum(["DDR4", "DDR5"]),
  wifi: z.boolean(),
  m2Slots: z.number().int().min(0),
  sataPorts: z.number().int().min(0),
  supportedM2Protocols: z.array(z.enum(["NVMe", "SATA"])),
});

export const buildSchema = z.object({
  CPU: cpuSchema.optional(),
  GPU: gpuSchema.optional(),
  RAM: ramSchema.optional(),
  PSU: psuSchema.optional(),
  CASE: caseSchema.optional(),
  MOTHERBOARD: motherboardSchema.optional(),
  STORAGE: z.array(installedDriveSchema),
});

export const savedBuildSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  build: buildSchema,
});

export const savedBuildListSchema = z.array(savedBuildSchema);
