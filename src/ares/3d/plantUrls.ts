// GLB plant assets — loaded via Vite ?url + drei useGLTF, mirroring
// the buildings pattern in `buildingUrls.ts`. Each species that has a
// GLB sourced under `assets/plants/<species>.glb` gets a URL here; the
// rest fall back to the procedural rendering in `PlantStages.tsx`.

import { useGLTF } from "@react-three/drei";
import lettuceUrl from "./assets/plants/lettuce.glb?url";
import pepperUrl from "./assets/plants/pepper.glb?url";
import tomatoUrl from "./assets/plants/tomato.glb?url";

// Partial map: species without a GLB still fall through to the
// procedural mesh in PlantStages.tsx. Add new species here as their
// GLBs land under assets/plants/.
export const PLANT_URLS: Partial<Record<"lettuce" | "mizuna" | "pepper" | "tomato", string>> = {
  lettuce: lettuceUrl,
  // mizuna:  mizunaUrl,   // ← uncomment after dropping the GLB
  pepper: pepperUrl,
  tomato: tomatoUrl,
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
  // Lettuce GLB is ~3 m tall in native units. 0.07 was too small — at
  // stage 1 the rosette became invisible against the pot rim. 0.20 puts
  // stage-5 at ~60 cm canopy and stage-1 still legible (~18 cm).
  lettuce: { scaleMul: 0.20, yOffset: 0, rotY: 0 },
  // Pepper GLB is ~0.5 m tall in meters; 0.60 stage-5 ~30 cm canopy fits
  // the pot. Stays unchanged from previous tune.
  pepper: { scaleMul: 0.60, yOffset: 0, rotY: 0 },
};

// Preload all GLBs we have at module-load time so the first drill-in
// doesn't pay an asset-fetch tax on top of the LLM warmup.
Object.values(PLANT_URLS).forEach((u) => {
  if (u) useGLTF.preload(u);
});
