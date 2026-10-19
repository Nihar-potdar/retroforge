import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
const root = process.argv[2] ?? "public/models";
const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (/\.(glb|js|css)$/.test(path)) {
      const bytes = await readFile(path);
      const row = {
        path,
        bytes: bytes.length,
        gzipBytes: gzipSync(bytes).length,
      };
      if (path.endsWith(".glb")) {
        const data = JSON.parse(
          bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString(),
        );
        const primitives =
          data.meshes?.flatMap((mesh) => mesh.primitives) ?? [];
        row.primitives = primitives.length;
        row.triangles = primitives.reduce(
          (n, p) =>
            n +
            (p.indices === undefined
              ? data.accessors[p.attributes.POSITION].count
              : data.accessors[p.indices].count) /
              3,
          0,
        );
      }
      files.push(row);
    }
  }
}
await walk(root);
const result = {
  root,
  files,
  totals: {
    bytes: files.reduce((n, x) => n + x.bytes, 0),
    gzipBytes: files.reduce((n, x) => n + x.gzipBytes, 0),
    primitives: files.reduce((n, x) => n + (x.primitives ?? 0), 0),
    triangles: files.reduce((n, x) => n + (x.triangles ?? 0), 0),
  },
};
if (process.argv[3]) {
  await mkdir("docs", { recursive: true });
  await writeFile(process.argv[3], JSON.stringify(result, null, 2) + "\n");
}
console.log(JSON.stringify(result, null, 2));
