import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    exclude: ["node_modules/**", "e2e/**"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      exclude: ["node_modules/**", "e2e/**"],
      include: [
        "src/Logic/Compatibility/{Compatibility,CompatibilityRules,CandidateCompatibility,BuildAssessment,Power,Issue}.ts",
      ],
      reporter: ["text", "html", "json-summary"],
      thresholds: { perFile: true, lines: 90, branches: 90 },
    },
  },
});
