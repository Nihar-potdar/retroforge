import { readFile, writeFile } from "node:fs/promises";
import assets from "../src/models/assets.json" with { type: "json" };
const products = [];
for (const category of ["cpu", "gpu", "motherboard", "ram", "psu", "case"]) {
  const text = await readFile(`src/data/${category}.ts`, "utf8");
  for (const match of text.matchAll(/\bid:\s*(\d+),\s*name:\s*"([^"]+)"/g)) {
    const exact = category === "case" && match[2] === "Corsair 4000D Airflow";
    products.push({
      category,
      productId: Number(match[1]),
      name: match[2],
      fidelity: exact ? "exact" : "illustrative",
      asset: assets[category].url,
      dimensionsVerified: false,
      nextStep: exact
        ? "Verify dimensions and mounting anchors"
        : "Source or create licensed product-specific model; verify identity, dimensions and anchors",
    });
  }
}
await writeFile(
  "docs/model-coverage.json",
  JSON.stringify(
    {
      products,
      exact: products.filter((p) => p.fidelity === "exact").length,
      total: products.length,
    },
    null,
    2,
  ) + "\n",
);
console.log(`${products.length} products inventoried`);
