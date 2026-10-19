// the whole build type... can be used for prebuilds as well as custom build validation
export type BUILD = {
  RAM?: RAM;
  CPU?: CPU;
  GPU?: GPU;
  PSU?: PSU;
  CASE?: CASE;
  STORAGE: InstalledDrive[];
  MOTHERBOARD?: Motherboard;
};

export type CPU = {
  componentType: "CPU";
  id: number;
  name: string;
  brand: "AMD" | "Intel";
  image: string;
  price: number;
  socket: string;
  cores: number;
  threads: number;
  baseClock: number;
  boostClock: number;
  tdp: number;
  /** Stock sizing budget (Intel MTP / AMD PPT or platform budget); see docs/power-policy.md. */
  maxPowerW?: number;
  integratedGraphics: boolean;
  performanceScore: number;
};

export type GPU = {
  componentType: "GPU";
  id: number;
  name: string;
  brand: "NVIDIA" | "AMD";
  image: string;
  price: number;
  chipset: string;
  vram: number;
  tdp: number;
  boardPowerW?: number;
  recommendedPsuW?: number;
  length: number;
  performanceScore: number;
};

export type PSU = {
  componentType: "PSU";
  id: number;
  name: string;
  brand: string;
  image: string;
  price: number;
  wattage: number;
  efficiencyRating: "80+ Bronze" | "80+ Gold" | "80+ Platinum" | "80+ Titanium";
  modularity: "Non-Modular" | "Semi-Modular" | "Fully Modular";
  formFactor: "ATX" | "SFX";
};

export type RAM = {
  componentType: "RAM";
  id: number;
  name: string;
  brand: string;
  image: string;
  price: number;
  type: "DDR4" | "DDR5";
  capacity: number;
  speed: number;
  modules: string;
  rgb: boolean;
  casLatency: number;
};

// Standard Protocol type for motherboard and Storage
export type StorageProtocol = "NVMe" | "SATA";

export type Motherboard = {
  componentType: "Motherboard";
  id: number;
  name: string;
  brand: string;
  image: string;
  price: number;
  socket: string;
  chipset: string;
  formFactor: "ATX" | "Micro ATX" | "Mini ITX";
  ramType: "DDR4" | "DDR5";
  wifi: boolean;
  m2Slots: number;
  sataPorts: number;
  supportedM2Protocols: StorageProtocol[];
};

export type STORAGE = {
  componentType: "Storage";
  id: number;
  name: string;
  brand: string;
  image: string;
  price: number;
  storageType: "SSD" | "HDD";
  connector: "M.2" | "SATA";
  protocol: StorageProtocol;
  formFactor: "M.2 2280" | "2.5-inch" | "3.5-inch";
  capacityGB: number;
  readSpeedMBps: number;
  writeSpeedMBps: number;
};

export type CASE = {
  componentType: "Case";
  id: number;
  name: string;
  brand: string;
  image: string;
  price: number;
  formFactor: "ATX" | "Micro ATX" | "Mini ITX";
  maxGpuLength: number; // mm
  maxCoolerHeight: number; // mm
  radiatorSupport: string; // e.g. "240mm", "360mm"
  color: string;
  rgb: boolean;
  temperedGlass: boolean;
};

export type ComponentType =
  "CPU" | "RAM" | "GPU" | "PSU" | "Motherboard" | "Case" | "Storage";

export type CompatibleComponent =
  CPU | GPU | PSU | RAM | Motherboard | CASE | STORAGE;

export type CompatibilityResult = {
  selectedComponent: string;
  targetComponent: string;
  isCompatible: boolean;
  error?: DetailedErrors;
};

type CompatibilityCheck = {
  bivarianceHack(
    selectedComponent: CompatibleComponent,
    targetComponent: CompatibleComponent,
  ): boolean | RuleCheckResult;
}["bivarianceHack"];

export type CompatibilityRule = {
  check: CompatibilityCheck;
  target: CompatibleComponent[];
};

export type InstalledDrive = {
  instanceId: string;
  product: STORAGE;
};

export type Category = "GPU" | "CPU" | "RAM" | "PSU" | "CASE" | "MOTHERBOARD";

export type SavedBuild = {
  id: string;
  name: string;
  build: BUILD;
};

export type preBuild = {
  id: string;
  name: string;
  description: string;
  tier: "Starter" | "Balanced" | "High-End" | "Workstation";
  useCase: string[];
  build: BUILD;
};

export type DetailedErrors = {
  key: string;
  type: "error" | "warning";
  rule: CompatiblityRule;
  title: string;
  compatibilityIssue: string;
  source?: ComponentRefernce;
  target?: ComponentRefernce;
  affectedParts: ComponentRefernce[];
  suggestedAction: Category | "STORAGE";
};

export type ComponentRefernce = {
  id: number;
  name: string;
  componentType: ComponentType;
  value: string;
  instanceId?: string;
};

export type CompatiblityRule =
  | "CPU_MOTHERBOARD_SOCKET"
  | "RAM_MOTHERBOARD_TYPE"
  | "PSU_WATTAGE"
  | "PSU_HEADROOM"
  | "POWER_DATA_INCOMPLETE"
  | "GPU_CASE_CLEARANCE"
  | "MOTHERBOARD_CASE_FORM_FACTOR"
  | "STORAGE_CONNECTOR"
  | "STORAGE_PROTOCOL"
  | "STORAGE_CAPACITY";

export type PowerBreakdown = {
  cpuW: number;
  gpuW: number;
  motherboardW: number;
  ramW: number;
  storageW: number;
  accessoriesW: number;
  estimatedLoadW: number;
  recommendedPsuW: number;
  vendorPsuW: number;
  missingComponents: string[];
  uncertainParts: ComponentRefernce[];
  isPartial: boolean;
};

export type BuildAssessment = {
  issues: DetailedErrors[];
  power: PowerBreakdown;
};

export type RuleCheckResult =
  | {
      isCompatible: true;
    }
  | {
      isCompatible: false;
      error: DetailedErrors;
    };

export type CompatibilityFilter = "all" | "compatible";

export type PsuCompatibility = {
  check1: CompatibilityCheck;
  check2: CompatibilityCheck;
  target: CompatibleComponent[];
  isCompatible: boolean;
  wattage: number;
};
