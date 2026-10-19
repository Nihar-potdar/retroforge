import type { DetailedErrors as DetailedError } from "./type";

export const DetailedErrors: DetailedError[] = [
  {
    key: "CPU_MOTHERBOARD_SOCKET:example",
    affectedParts: [],
    type: "error",
    title: "CPU/MOTHERBOARD mismatch",
    rule: "CPU_MOTHERBOARD_SOCKET",
    compatibilityIssue: "The motherboard and CPU sockets do not match.",
    source: {
      id: 0,
      name: "Ryzen 5600",
      componentType: "CPU",
      value: "AM4",
    },
    target: {
      id: 0,
      name: "random motherboard",
      componentType: "Motherboard",
      value: "AM5",
    },
    suggestedAction: "MOTHERBOARD",
  },
];
