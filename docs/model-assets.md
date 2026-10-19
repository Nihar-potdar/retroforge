# Model assets and fidelity

Source GLBs live in `assets/source-models/`, outside Vite's public folder. Only
optimized assets are deployed. Run `npm run models:optimize` to regenerate the
six independent, fingerprinted models and their metadata, then
`npm run models:measure` and `node tools/model-inventory.mjs`.

The pipeline removes unused data, extracts CPU and one RAM module from the
combined motherboard asset, welds/deduplicates geometry, flattens/joins static
meshes, applies error-bounded simplification, resizes textures to at most 512px,
encodes WebP, and applies Meshopt compression. CPU and RAM are removed from the
board asset. The old invisible case panel is removed. Original licences and
attribution remain in asset metadata and in the builder's preview disclosure.

Current coverage: 60 catalogue products, one product-identified asset (Corsair
4000D Airflow), and illustrative fallbacks for the other 59. Even that case has
not had its geometry dimensions or mounting clearances independently verified.
All assemblies are labelled schematic. See `model-coverage.json` for the exact
product inventory and the work needed to improve coverage.

New exact assets require a verified product identity, a redistribution licence,
correct orientation/scale, physical dimensions and mounting anchors, compatible
placement profiles, and visual regression checks. Add the asset to the pipeline
and update the typed registry. Never silently assign exact fidelity based only
on a similar GPU chip name, brand, or product ID.

The renderer caches by asset URL and loads at most two assets concurrently.
Each mounted component has its own Suspense/error boundary; an unavailable model
cannot block the rest of the assembly or the DOM builder. RAM instances reuse
geometry/materials but follow the selected kit's module count. Storage is a
lightweight schematic mesh. No unselected assets preload.

Quality is Auto/High/Low. Auto starts lower on a phone-sized viewport and uses
sustained frame samples with hysteresis to change resolution/shadow cost. Camera
damping and installation request frames while active; settled scenes stop
rendering, and hidden tabs suspend rendering. Explicit High/Low overrides remain
available when browser storage is disabled.

Source credits:

- Case: kirigami318, CC BY 4.0, https://sketchfab.com/3d-models/corsair-4000d-airflow-free-34df3ba96cf94e71accdb5779c4b8694
- Board/CPU/RAM: Daniel Cardona, CC BY 4.0, https://sketchfab.com/3d-models/motherboard-components-3bc94057328243d4b341a55f59160f8a
- GPU: GameDevGiant, CC BY 4.0, https://sketchfab.com/3d-models/nvidia-rtx-2080-ti-fcfffc0cdb784c77b226d4e280bc33b0
- PSU: dhafintaufiqi21, CC BY 4.0, https://sketchfab.com/3d-models/psu-power-supply-unit-69ccd1be3a77497cb2acc9e39e7c52b3

Placement uses the original Corsair calibration in one shared coordinate frame,
normalized once to a fixed 4.5-unit case height. The extracted CPU and RAM retain
their original motherboard coordinates; two-module kits occupy alternating
source slots. Other cases still use this illustrative arrangement. This is
visual calibration, not a verified physical mounting or clearance model.

Fresh builds and Reset install the Corsair 4000D Airflow. Loaded builds are
preserved exactly. Cases never animate; other components use the original
exponential entry slides (speed 8), with immediate removal and replacement of
obsolete models. Initial/load/reset and reduced-motion rendering are immediate.
