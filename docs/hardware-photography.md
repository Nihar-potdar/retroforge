# Real hardware photography

Prepared for the approved Redline catalogue direction. These are educational examples, not product-specific photographs for every catalogue entry and not evidence of physical fit. Integrated with the user's Redline direction and subsequent request for a less crowded layout. The original dense comp's plan review is superseded; no asset-review receipt is asserted.

`src/data/hardwarePhotos.json` records exact titles, alt text, authors, source pages, licenses, license URLs, transformation statements, responsive widths, and bytes. Original source images and rejected candidates stay under `assets/source-photos/`, outside the public build. Browser-delivered variants live in `public/images/photography/`.

## Selected examples

| Subject | Actual example | Source width | License |
| --- | --- | ---: | --- |
| Processor | Intel Core i7-6700K, 2015, top view | 2000px | CC BY-SA 4.0 |
| Graphics | NVIDIA GTX 1070 Founders Edition, 2016, Evan-Amos studio photograph | 4700px | Public domain |
| Memory | G.Skill Ripjaws V DDR4 module | 5816px | CC BY-SA 4.0 |
| Storage | Samsung 980 PRO 1TB M.2 NVMe SSD | 3691px | CC BY-SA 4.0 |
| Motherboard | ASUS Crosshair IV Formula, 2010-era example | See manifest | CC BY-SA 3.0 AT |
| Power supply | Acer Aspire Z5763 OEM PSU, exterior example | 1920px served source | CC BY-SA 4.0 |
| Case | Fractal Design Focus G | 3652px | CC BY-SA 4.0 |
| Installed system | ASUS Strix RTX 4090 in a custom PC | 4000px | CC BY-SA 4.0 |

Photos are proportionally resized and converted to WebP; no generative reconstruction, invented details, or upscaling. Sources and transformations must be credited wherever the photos are used, with license links. Share-alike image derivatives keep their respective licenses; the manifest is the precise attribution record.

## Delivery

Most variants are 800, 1600, and 2400 pixels wide. Processor stops at 2000 and PSU at 1920. Use `srcSet` with actual display `sizes`; do not serve a 2400px photo to a 300px thumbnail. At 800px, GPU/RAM/SSD are approximately 34/16/27 KiB; the CPU has photographic grain and is approximately 188 KiB. Inspection views may request the largest variant only when opened.

`tools/fetch-hardware-photos.mjs` reproduces retrieval/conversion and provenance. Five separate PNG sources under `assets/plates/` support the comp workflow; production delivery should use the responsive WebP variants. The original wooden-workbench concept image is not a shipping asset: use these genuine photographs and make their different framing deliberate in the approved layout.

## Quality review

Rejected the noisy RTX 3090 on packaging, soft ASRock P4i65G board, green-background Corsair PSU, connector-only Corsair image, and dim modular-port image. Reasons and metadata remain in `assets/source-photos/rejected/manifest.json`. All selected photos were visually inspected; the provenance scan found 29 rasters and no missing records.

## Integration

`HardwareImage` delivers responsive WebP variants. `HardwarePhoto` adds the example name and an accessible inspection dialog that requests the largest image only when opened. Home features one graphics card, then one selected educational part at a time; all seven categories are available. The guide index, articles, and ready-made build examples use the same source set. Expanded footer credits include source, author, license links, and conversion notice; the photo dialog repeats the specific attribution. Ready-made builds label the installed-system photo as an example that varies from their configurations.
