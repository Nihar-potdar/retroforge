# Compatibility and PSU sizing

`assessBuild(BUILD)` is the canonical assessment for the builder, candidates,
saved builds, prebuilts and the development compatibility tester. Its result
contains `issues` and `power`. Pair-only catalogue checks remain available through
`compatibilityEngine`; they cannot determine whole-system PSU or storage capacity.

## Policy

The stock-load sizing estimate adds CPU package power budget, GPU board power,
50W per selected motherboard, 20W per RAM kit, 10W per installed SSD, 25W per
installed HDD, and 30W for cooling/accessories when a CPU or motherboard is present.
Repeated products count once per **installed instance**. These smaller-component
allowances are application assumptions, not manufacturer measurements.

The recommendation is `ceil(max(estimatedLoadW * 1.25, vendorPsuW))`. It is a
minimum sizing target in watts; choose an available PSU meeting it. The 25%
margin is an application policy, not an electrical transient guarantee. GPU
vendor recommendations are whole-system guidance and may depend on the vendor's
reference configuration; they are never added to board power.

- Below estimated load: `PSU_WATTAGE` error.
- At/above load but below the recommendation: `PSU_HEADROOM` warning.
- At/above the recommendation: no wattage issue.
- Efficiency ratings do not reduce the PSU's rated DC output.
- No PSU selected: show the estimate, without a PSU compatibility issue.
- Missing CPU, motherboard, RAM, storage, or required discrete GPU: show a partial
  estimate and the missing categories. An integrated-graphics CPU does not need
  a discrete GPU for the estimate to be complete. PSU and case are not load inputs.

Wattage assessment does not check connectors, 12V rail limits, PSU dimensions,
quality, ATX transient compliance, CPU cooling, overclocking, PBO, unlimited
motherboard power settings, or external accessories beyond the fixed allowance.
Case form-factor checks use the catalogue's simplified maximum-size model; shared
M.2/SATA lanes and exact mounting/slot layouts are not represented.

## Catalogue sources

Reviewed 2026-10-11. GPU values are reference-board specifications; specific partner
cards can differ. CPU `maxPowerW` is a sizing budget, not predicted consumption.
Intel values use published Maximum Turbo Power. AMD budgets use stock PPT/platform
power limits, including original stock-setting investigations where AMD's public
product pages publish only thermal TDP. Those investigations are identified below;
they must not be described as per-model manufacturer maximum-power specifications.

| CPU | Budget | Basis/source |
| --- | ---: | --- |
| Ryzen 5 5600 | 88W | Conservative AM4 65W platform budget, not a claim of measured draw; [AMD Ryzen Master reference guide](https://www.amd.com/content/dam/amd/en/documents/products/software-tools/ryzen-master-quick-reference-guide.pdf), Eco-Mode infrastructure discussion |
| Ryzen 7 5700X3D | 142W | AM4 105W platform budget; same AMD reference guide's PPT explanation and 105W infrastructure example |
| Ryzen 5 7600 | 88W | AM5 65W platform budget; [AMD's power/temperature explanation](https://amd-heroes.jp/article/2023/03/22850/) |
| Ryzen 7 7800X3D | 162W | [Original stock-setting investigation](https://skatterbencher.com/2023/04/05/skatterbencher-60-amd-ryzen-7-7800x3d-overclocked-to-5400-mhz/), introduction and stock-performance sections |
| Ryzen 9 9900X | 162W | [Original stock-setting investigation](https://skatterbencher.com/2025/09/27/skatterbencher-92-ryzen-9-9900x-overclocked-to-5825-mhz/), default Precision Boost parameters |
| Core i5-12400F | 117W | [Intel specifications](https://www.intel.com/content/www/us/en/products/compare.html?productIds=134586%2C134587) |
| Core i5-13600K | 181W | [Intel specifications](https://www.intel.com/content/www/us/en/products/sku/230493/intel-core-i513600k-processor-24m-cache-up-to-5-10-ghz/specifications.html) |
| Core i7-14700K | 253W | [Intel specifications](https://www.intel.com/content/www/us/en/products/sku/236783/intel-core-i7-processor-14700k-33m-cache-up-to-5-60-ghz/specifications.html) |
| Core i9-14900K | 253W | [Intel specifications](https://www.intel.com/content/www/us/en/products/sku/236773/intel-core-i9-processor-14900k-36m-cache-up-to-6-00-ghz/specifications.html) |
| Core Ultra 7 265K | 250W | [Intel product brief](https://www.intel.com/content/www/us/en/products/docs/processors/core-ultra/core-ultra-desktop-processors-series-2-brief.html) |

| GPU | Board power | Vendor PSU recommendation | Source |
| --- | ---: | ---: | --- |
| RTX 3060 12GB | 170W | 550W | [NVIDIA](https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3060-3060ti/) |
| RTX 4060 | 115W | 550W | [NVIDIA](https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/) |
| RTX 4070 SUPER | 220W | 650W | [NVIDIA](https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/) |
| RTX 4080 SUPER | 320W | 750W | [NVIDIA](https://www.nvidia.com/en-au/geforce/graphics-cards/40-series/rtx-4080-family/) |
| RTX 4090 | 450W | 850W | [NVIDIA](https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/) |
| RX 6600 | 132W | 450W | [AMD](https://www.amd.com/en/products/graphics/desktops/radeon/6000-series/amd-radeon-rx-6600.html) |
| RX 7600 | 165W | 550W | [AMD](https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7600.html) |
| RX 7800 XT | 263W | 700W | [AMD](https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7800-xt.html) |
| RX 7900 GRE | 260W | No published floor | [AMD](https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7900-gre.html) |
| RX 7900 XTX | 355W | 800W | [AMD](https://www.amd.com/en/products/graphics/desktops/radeon/7000-series/amd-radeon-rx-7900xtx.html) |

`recommendedPsuW: 0` means the verified vendor reference has no published floor.
An absent field means unknown data and produces `POWER_DATA_INCOMPLETE`.

## Saved builds and issue handling

New power fields are optional in saved-build schemas. Recover missing power
metadata only when component type, catalogue ID **and name** match. Preserve all
other saved specifications and any explicit power overrides. Unmatched old/custom
parts use TDP as an uncertain fallback and receive a data warning. New power
fields must be finite positive numbers; a vendor recommendation can also be zero.

Issues have stable keys, error/warning severity and `affectedParts`. Source/target
references are optional; system-level power and aggregate storage issues are not
fake pair conflicts. Storage references include instance IDs.

Only errors exclude candidates from the compatible filter or require an install
override. Warnings remain visible and selectable. Candidate checks report related
issues; power-consuming candidates report system sizing issues when they raise
load or the recommendation. PSU candidates report their own sizing issues. A
lower-power replacement can remain selectable while a previous PSU error remains;
the full-build panel still reports that error. Installation evaluates the entire
proposed build, so remaining errors still require acknowledgement.

The desktop and mobile panels derive their assessment from the current build;
loading, removal, overrides and resets cannot leave stale stored issue lists.

## Verification and extension

Use npm and the npm lockfile for this workflow, matching deployment:

```sh
npm run test:run       # all tests once
npm test              # watch
npm run test:coverage  # at least 90% lines and branches in each engine/power module
npm run lint
npm run build
```

Tests cover pair boundaries, aggregate capacity, repeated products, candidate/full
build consistency, unrelated conflicts, power budgets and PSU thresholds,
legacy data, catalogue/schema validity and prebuilts. They use numeric expectations
independent of implementation output. The six initial regression tests were
confirmed failing against the previous engine before it was changed.

For new rules, provide actionable affected-part references and pass/fail/boundary
tests. Do not make a green coverage percentage your definition of correctness.
