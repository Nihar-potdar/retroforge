import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dedup,
  prune,
  weld,
  flatten,
  join,
  simplify,
  meshopt,
  textureCompress,
} from "@gltf-transform/functions";
import {
  MeshoptDecoder,
  MeshoptEncoder,
  MeshoptSimplifier,
} from "meshoptimizer";
import sharp from "sharp";
import { mkdir, writeFile, readdir, unlink } from "node:fs/promises";
import { createHash } from "node:crypto";
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "meshopt.decoder": MeshoptDecoder,
    "meshopt.encoder": MeshoptEncoder,
  });
await Promise.all([
  MeshoptDecoder.ready,
  MeshoptEncoder.ready,
  MeshoptSimplifier.ready,
]);
const output = "public/models/optimized";
await mkdir(output, { recursive: true });
const manifest = {};
const jobs = [
  ["case", "corsair_400d.glb"],
  ["gpu", "nvidia_rtx_2080_ti.glb"],
  ["psu", "psu_power_supply_unit.glb"],
  ["motherboard", "motherboard__components.glb"],
  ["cpu", "motherboard__components.glb"],
  ["ram", "motherboard__components.glb"],
];
for (const [kind, file] of jobs) {
  const doc = await io.read(`assets/source-models/${file}`);
  const credits = doc.getRoot().getAsset().extras;
  if (["motherboard", "cpu", "ram"].includes(kind)) {
    const groups = doc
      .getRoot()
      .listNodes()
      .filter((n) =>
        ["CPU", "RAM", "RAM1", "RAM2", "RAM3"].includes(n.getName()),
      );
    if (kind === "motherboard") groups.forEach((n) => n.dispose());
    else {
      const selected = groups.find(
        (n) => n.getName() === (kind === "cpu" ? "CPU" : "RAM"),
      );
      if (!selected) throw Error(`Missing ${kind} group`);
      const world = selected.getWorldMatrix();
      for (const parent of selected.listParents())
        if ("removeChild" in parent) parent.removeChild(selected);
      selected.setMatrix(world);
      const scene = doc.getRoot().listScenes()[0];
      scene.listChildren().forEach((n) => scene.removeChild(n));
      scene.addChild(selected);
    }
  }
  if (kind === "case")
    doc
      .getRoot()
      .listNodes()
      .filter((n) => n.getName() === "Object_42")
      .forEach((n) => n.dispose());
  await doc.transform(
    prune(),
    dedup(),
    weld(),
    flatten(),
    join(),
    simplify({ simplifier: MeshoptSimplifier, ratio: 0.45, error: 0.001 }),
    textureCompress({
      encoder: sharp,
      targetFormat: "webp",
      resize: [512, 512],
    }),
    meshopt({ encoder: MeshoptEncoder, level: "medium" }),
    prune(),
  );
  const bytes = await io.writeBinary(doc);
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
  const name = `${kind}-${hash}.glb`;
  await writeFile(`${output}/${name}`, bytes);
  manifest[kind] = {
    url: `models/optimized/${name}`,
    bytes: bytes.length,
    credits,
    primitives: doc
      .getRoot()
      .listMeshes()
      .reduce((n, m) => n + m.listPrimitives().length, 0),
  };
  console.log(kind, bytes.length, manifest[kind].primitives);
}
await writeFile(
  "src/models/assets.json",
  JSON.stringify(manifest, null, 2) + "\n",
);

// This directory is generated output; remove only stale fingerprinted files.
const currentFiles = new Set(
  Object.values(manifest).map((asset) => asset.url.split("/").pop()),
);
for (const file of await readdir(output))
  if (
    /^(case|cpu|gpu|motherboard|ram|psu)-[a-f0-9]{12}\.glb$/.test(file) &&
    !currentFiles.has(file)
  )
    await unlink(`${output}/${file}`);
