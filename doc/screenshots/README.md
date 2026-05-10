# Screenshots — `feat/rover-final` post-polish

Captured via Playwright + Chromium 147 on the dev stack
(`http://127.0.0.1:1420/#ares`) on 2026-05-10 ~08:50 CEST after
cherry-picking `4905b2f` (Codex's mars-base-polish branch) onto the
citation-excerpt commit `3a347c0`.

| File | Viewport | What it shows |
|---|---|---|
| `01-mars-base-hero-polished.png` | 1280 × 720 | `/#ares` first paint — header + side rail + 3D Mars base hero with all 7 polished GLB buildings + cinematic fog. Greenhouse glows green ("HARVEST READY"). |
| `02-mars-base-wide-1600x1000.png` | 1600 × 1000 | Same view at presentation aspect. Cleaner reading of the buildings + telemetry rail. |
| `03-greenhouse-drillin-4-species.png` | 1600 × 1000 | Greenhouse drill-in modal. 4 shelves, 4 pots each: Red Robin tomato (top), Hatch chile pepper, Mizuna mustard (mid-rack, with one pot selected — yellow ring), Outredgeous lettuce (bottom). All 4 species visibly distinct. |

## Polish round-up — what Codex's `polish: upgrade mars base visuals` changed

| File | Change |
|---|---|
| `src/ares/3d/MarsBase.tsx` | Cinematic lighting + denser fog. |
| `src/ares/3d/MarsTerrain.tsx` | Crater pits, scattered rocks, color variation across the regolith. |
| `src/ares/3d/Pot.tsx` | Cleaner pot rim lighting. |
| `src/ares/3d/WireMeshShelf.tsx` | Sharper wire grid. |
| `src/ares/3d/GreenhouseRack.tsx` | Top gantry beam, glow strip on each shelf, accent rail. |
| 7× `assets/buildings/*.glb` | Re-baked via `_source/generate_buildings.py` (~+200 LOC). All bumped from ~10–32 KB to ~20–45 KB — more mesh detail per building. |
| `src/index.css` | Responsive HUD micro-polish (no overlap on narrow viewports). |
| `src/ares/components/RepairAssist.tsx` | Added `ares-repair-button` class for the new CSS. |
| `src/ares/components/VoicePTT.tsx` | Same — wired to the new responsive layout. |
| `src/ares/AresApp.tsx` | Reflows the bottom-button row to align with the new HUD. |

## Reproduce the screenshots

```bash
# 1. Boot the dev stack
bash scripts/dev.sh

# 2. Take screenshots (requires playwright + chromium installed once)
node <<'EOF'
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h, name] of [[1280, 720, 'hero'], [1600, 1000, 'wide']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    const p = await ctx.newPage();
    await p.goto('http://127.0.0.1:1420/#ares', { waitUntil: 'networkidle' });
    await p.waitForTimeout(4500);
    await p.screenshot({ path: `doc/screenshots/${name}-${w}x${h}.png` });
  }
  await b.close();
})();
EOF
```
