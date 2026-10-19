# Builder performance

## October 19 builder investigation

`node tools/benchmark-model-start.mjs <label>` records a cold desktop and phone
visit to the first prebuilt against the production server on port 4175. It
captures model request start/end times, decoded-ready marks, canvas creation,
page errors, and screenshots. Measurements are milliseconds since navigation,
including the prebuilt route. Each result is one sample per device, not a median
or a real-device acceptance result. Headless Chromium uses software rendering;
phone CPU is throttled 4×, with 80 ms latency and 1 MB/s download throughput.

| Experiment | Desktop last download / last decoded | Phone last download / last decoded |
| --- | ---: | ---: |
| Current implementation (`model-start-before.json`) | 4,547 / 5,564 | 4,951 / 5,291 |
| Preload selected models before scene startup (`model-start-after.json`) | 3,357 / 6,425 | 3,416 / 4,303 |
| Low-priority preloads (`model-start-final.json`) | 3,363 / 4,533 | 3,964 / 5,778 |
| Preloads after canvas startup (`model-start-verified.json`) | 3,587 / 6,996 | 4,096 / 5,284 |
| Two Meshopt decoder workers (`model-start-workers.json`) | 5,523 / 7,785 | 4,923 / 5,219 |

Neither preloading nor decoder workers established consistent end-to-end gains,
so neither change was retained. Early preloads competed with the scene module:
desktop canvas creation moved from 1,859 ms to 2,709 ms. The after-canvas run
overlapped browser regression tests, so its CPU timings are confounded. Results
are diagnostic evidence, not comparative performance claims. Asset bytes and
model fidelity were unchanged in every experiment. No page errors occurred.

The baseline exposes a fetch/decode queue waterfall, but removing that waterfall
alone does not solve readiness. Future work should profile main-thread parsing,
texture upload, and shader compilation on a hardware GPU before choosing the
next optimization. This investigation did not establish a runtime speedup.

Validation: production build, 151 unit tests, and six desktop/phone browser checks
covering complete assets, failed-model recovery, and keyboard build/save flows.
The existing scene chunk-size warning remains.

The asset pipeline reduces the complete six-component model set from
18,073,612 bytes to 1,652,128 bytes: **90.9% less data, or 10.9× smaller**.
Gzip sizes fall from 8,053,552 to 991,950 bytes (8.1× smaller). Compression
must be enabled by the deployment server to obtain those gzip transfer sizes.
Geometry falls from 810 mesh primitives to 67 and from 333,620 triangles to
178,446. These are asset counts, not measured renderer draw calls.

The final production JS, CSS, and GLBs total 3,462,850 bytes (1,506,789 gzip).
This is an inventory of those file types across all routes, not the initial
page download. Fonts, HTML, guide pictures, and protocol overhead are excluded.
The lazy Three.js scene remains about 1 MB minified / 271 KB gzip. The DOM
builder is a separate 120 KB / 34 KB gzip chunk, so model decoding does not
block selecting parts, checking compatibility, or saving a build.

## Final browser comparison

Medians of two runs per version/device/cache state, measured against the
production redesign before the tight-placement/snappy-animation follow-up.
The benchmark JSON records that earlier build hash; it is not a measurement
of the subsequent animation timing changes. The GLB assets remain unchanged. Times below are milliseconds. All 16 runs completed without
page errors. Two repeats describe this session; they are not a statistical
confidence interval.

| Metric                               | Desktop before → after         | Phone before → after           |
| ------------------------------------ | ------------------------------ | ------------------------------ |
| Cold builder controls ready          | 838.5 → 192.5 (4.4× faster)    | 1,768.5 → 738 (2.4× faster)    |
| Cold canvas element created          | 852.5 → 1,094                  | 1,774.5 → 1,660.5              |
| Cold model downloads complete        | 20,360.5 → 7,388 (2.8× faster) | 21,527.5 → 4,339 (5.0× faster) |
| Warm model downloads complete        | 9,547 → 5,141 (1.9× faster)    | 10,084 → 4,382.5 (2.3× faster) |
| Camera-drag RAF median, software GPU | 733.35 → 549.95 (1.3×)         | 525 → 350 (1.5×)               |
| Camera-drag RAF p95, software GPU    | 750 → 566.65                   | 549.95 → 375                   |

The sampled journey's decoded same-origin response bodies fell from
19,730,916 to 3,355,348 bytes (5.9× smaller). Cold model transfers including
response overhead fell from 18,074,812 to 1,653,928 bytes. Warm optimized model
transfers totaled 1,800 bytes of overhead while reusing cached bodies.

New-build cold model decode readiness took 9,591.5 ms on desktop and 7,618.5 ms
on phone; no equivalent baseline instrumentation exists. Automatic quality
started High on desktop and moved to Low under sustained slow frame samples;
phone stayed Low. This confirms adaptation ran, but does not make these slow
software-rendering intervals representative of hardware GPU performance.

The 4–5× target is achieved for the phone cold-download milestone and exceeded
for asset size. It is **not achieved universally**, and a 3–4× animation gain is
not established. Desktop canvas creation is slightly slower while the DOM
controls are substantially earlier; splitting the scene lets interaction start
before WebGL is ready. The renderer now also generates its small reflection
environment locally rather than requesting an external HDR.

## Reproduce

Run `npm run models:optimize`, `npm run models:measure`, and
`node tools/measure-assets.mjs dist docs/production-assets.json` after building.
Original models are retained under `assets/source-models/` and never copied to
the public output. Generated assets use content hashes. Source fidelity and
licences are documented in [model-assets.md](model-assets.md).

For browser comparisons, serve the old production build on port 4174 and the
new build on 4175, then run `npm run perf:browser`. Override these using
`BASELINE_URL` and `OPTIMIZED_URL`. Install Playwright Chromium first. The
baseline used here was preserved before implementing the redesign; its HTML
asset links were corrected to the matching preserved files.

The harness opens the first prebuilt, uses 80 ms network latency and
1,000,000 bytes/second throughput, and runs desktop and 393×851 phone layouts.
Phone CPU is throttled 4×. Each version/device gets two fresh browser contexts;
each context runs a cold and then warm visit. Warm requests can revalidate
depending on server cache headers. `docs/browser-benchmark.json` contains
individual runs, model resource timings, errors, scene samples, and the final
production index hash.

Controls-ready, canvas-created, model-download-complete, and model-decode-ready
are distinct milestones. Decode readiness is instrumented only in the new
build; baseline download completion does not prove baseline decoding finished.
Response body bytes are decoded sizes. Resource Timing transfer sizes provide
the separate browser transfer measurement.

## Practical limits

Headless Chromium uses a software GPU on this machine. Its requestAnimationFrame
intervals during a camera drag are a lab responsiveness proxy, not a hardware
GPU frame-time measurement. Phone viewport and CPU throttling do not reproduce
a real Android GPU, thermals, memory pressure, or touch latency. These results
cannot establish 60 FPS or a universal 3–4× animation improvement.

Real-device acceptance still needs a midrange Android and a hardware-accelerated
desktop: record cold and warm loading, install/remove each component, orbit and
zoom a complete build for 30 seconds, check sustained frame times and memory,
and test background/resume. Compare Auto and forced High/Low under the same
conditions. Reduced-motion, keyboard, blocked storage, failed asset recovery,
and narrow/landscape layout are covered by the browser regression suite.

The renderer now loads only selected models, limits concurrent loads to two,
shares cached geometry/materials, retries failed downloads, renders on demand,
suspends rendering in hidden tabs, and adapts pixel ratio/shadows with hysteresis.
These reduce work while preserving installation and camera animation. Removals
now unmount immediately, matching the original builder. Entrances use the
original exponential slide rather than a timed fade/scale or retained exit.
The restored desktop information layout and transparent canvas have not been
re-benchmarked; the historical speed measurements above do not measure these
latest interface changes.
