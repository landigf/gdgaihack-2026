// GLB plant assets — loaded via Vite ?url + drei useGLTF, mirroring
// the buildings pattern in `buildingUrls.ts`. Each species that has a
// GLB sourced under `assets/plants/<species>.glb` gets a URL here; the
// rest fall back to the procedural rendering in `PlantStages.tsx`.

import { useGLTF } from "@react-three/drei";
import tomatoUrl from "./assets/plants/tomato.glb?url";

// We deliberately ship URLs only for species we have GLBs for — the
// loader in PlantStages.tsx checks for `species in PLANT_URLS` and
// falls back to the procedural mesh otherwise. Add new species here
// as their GLBs land under assets/plants/.
//
// Why a partial map: gives us an incremental upgrade path. We can
// ship the tomato model first, hand-tune its scale on the rack, then
// extend to lettuce / mizuna / pepper without ever breaking the build.
export const PLANT_URLS: Partial<Record<"lettuce" | "mizuna" | "pepper" | "tomato", string>> = {
  tomato: tomatoUrl,
  // lettuce: lettuceUrl,   // ← uncomment after dropping the GLB
  // mizuna:  mizunaUrl,
  // pepper:  pepperUrl,
};

// Per-species transform corrections. Sketchfab models come in arbitrary
// scale + up-axis; tune visually after the first render. Keys are the
// same as PLANT_URLS. Defaults to scaleMul=1, yOffset=0, rotY=0.
export const PLANT_TRANSFORM: Partial<Record<
  "lettuce" | "mizuna" | "pepper" | "tomato",
  { scaleMul: number; yOffset: number; rotY: number }
>> = {
  // Sketchfab tomato is in centimeters — coordinate values up to ~300.
  // Scale ~0.0015 brings a 30 cm plant down to roughly 0.45 m — fits
  // a pot of radius 0.16 with the foliage spreading outward.
  tomato: { scaleMul: 0.0015, yOffset: 0, rotY: 0 },
};

// Preload all GLBs we have at module-load time so the first drill-in
// doesn't pay an asset-fetch tax on top of the LLM warmup.
Object.values(PLANT_URLS).forEach((u) => {
  if (u) useGLTF.preload(u);
});
