import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

// Real, independently licensed educational examples; not catalogue products.
// Run normally to build from reviewed originals. --fetch refreshes their files.
const manifestPath = 'assets/source-photos/manifest.json';
const outputDirectory = 'public/images/photography';
const provenanceTool = '/home/nihar/.agents/skills/impeccable/scripts/impeccable';
const headers = { 'User-Agent': 'RetroForge/1.0 (educational PC builder; asset attribution research)' };
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const captions = {
  cpu: ['Intel Core i7-6700K · 2015', 'Top view of a real Intel Core i7-6700K processor, showing its metal heat spreader and green substrate. Educational example from 2015.'],
  gpu: ['NVIDIA GeForce GTX 1070 Founders Edition · 2016', 'Studio photograph of an NVIDIA GeForce GTX 1070 Founders Edition graphics card with a silver shroud and blower fan. Educational example from 2016.'],
  ram: ['G.Skill Ripjaws V DDR4 memory', 'A real red G.Skill Ripjaws V DDR4 memory module with its gold edge connector visible. Educational example.'],
  storage: ['Samsung 980 PRO · 1 TB NVMe SSD', 'Top view of a real Samsung 980 PRO 1 TB M.2 NVMe solid-state drive. Educational example.'],
  motherboard: ['ASUS Crosshair IV Formula · 2010 era', 'Detailed top view of a real ASUS Crosshair IV Formula motherboard, showing its CPU socket, memory slots and expansion slots. Educational example from the 2010 era.'],
  psu: ['Acer Aspire Z5763 ATX power supply', 'A real Acer Aspire Z5763 power supply photographed on a light background with its enclosure, fan vent and attached cables visible. Educational example.'],
  case: ['Fractal Design Focus G chassis', 'A real blue Fractal Design Focus G computer chassis with its side panel removed to show the empty interior. Educational example.'],
  assembly: ['Custom PC with ASUS ROG Strix RTX 4090', 'A real assembled computer with an ASUS ROG Strix RTX 4090 graphics card, CPU cooler and illuminated memory. Educational example.'],
};
await mkdir(outputDirectory, { recursive: true });
const output = {};
for (const [kind, photo] of Object.entries(manifest)) {
  if (!/^(CC BY(?:-SA)? [\d.]+(?: at)?|Public domain)$/.test(photo.license)) throw new Error(`Unreviewed license for ${kind}: ${photo.license}`);
  if (process.argv.includes('--fetch')) {
    const response = await fetch(photo.downloadUrl, { headers, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`${kind} download HTTP ${response.status}; existing original preserved`);
    const bytes = Buffer.from(await response.arrayBuffer());
    await sharp(bytes).metadata(); // Reject HTTP error pages before replacing originals.
    await writeFile(photo.originalPath, bytes);
  }
  const metadata = await sharp(photo.originalPath).metadata();
  const [title, alt] = captions[kind];
  const widths = [...new Set([800, 1600, Math.min(2400, metadata.width)].filter(width => width <= metadata.width))];
  const variants = [];
  const changes = 'Proportionally resized and converted to WebP; original framing and colors retained. No generative alteration or upscaling.';
  for (const width of widths) {
    const path = `${outputDirectory}/${kind}-${width}.webp`;
    const info = await sharp(photo.originalPath).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 86, effort: 5 }).toFile(path);
    // This runtime uses --prompt for provenance and JSON sidecars for WebP.
    // --origin is not implemented; source details are explicit in the text.
    const provenance = `Sourced photograph, not generated. ${photo.title}. Photographer: ${photo.author}. Source: ${photo.source}. License: ${photo.license} (${photo.licenseUrl}). ${changes}`;
    try {
      execFileSync(provenanceTool, ['embed-prompt', path, '--prompt', provenance], { stdio: 'pipe' });
    } catch (error) {
      // Some restricted runtimes report EPERM after the child completes. Only
      // accept that case when the tool's actual output sidecar is verified.
      const sidecar = JSON.parse(await readFile(`${path}.json`, 'utf8'));
      if (error.code !== 'EPERM' || sidecar.prompt !== provenance) throw error;
    }
    variants.push({ src: `/${path.replace(/^public\//, '')}`, width: info.width, height: info.height, bytes: (await stat(path)).size });
  }
  const fallback = variants.find(variant => variant.width === 1600) ?? variants.at(-1);
  output[kind] = { src: fallback.src, width: fallback.width, height: fallback.height, srcSet: variants.map(variant => `${variant.src} ${variant.width}w`).join(', '), alt, title, author: photo.author, source: photo.source, license: photo.license, licenseUrl: photo.licenseUrl, changes, example: true, variants };
  photo.width = metadata.width;
  photo.height = metadata.height;
  photo.bytes = (await stat(photo.originalPath)).size;
  photo.reviewed = true;
  console.log(`${kind}: ${variants.map(variant => `${variant.width}×${variant.height} ${Math.round(variant.bytes / 1024)} KiB`).join('; ')}`);
  await writeFile('src/data/hardwarePhotos.json', `${JSON.stringify(output, null, 2)}\n`);
}
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
