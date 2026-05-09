// Vite ?url imports give us hashed bundled URLs for the GLB assets.
// Loaded by GLBBuilding via drei's useGLTF.
import { useGLTF } from "@react-three/drei";

import habitatUrl from "./assets/buildings/habitat.glb?url";
import greenhouseUrl from "./assets/buildings/greenhouse.glb?url";
import eclssUrl from "./assets/buildings/eclss.glb?url";
import isruUrl from "./assets/buildings/isru.glb?url";
import powerUrl from "./assets/buildings/power.glb?url";
import airlockUrl from "./assets/buildings/airlock.glb?url";
import roverGarageUrl from "./assets/buildings/rover_garage.glb?url";

export const BUILDING_URL = {
  habitat: habitatUrl,
  greenhouse: greenhouseUrl,
  eclss: eclssUrl,
  isru: isruUrl,
  power: powerUrl,
  airlock: airlockUrl,
  rover_garage: roverGarageUrl,
} as const;

export type BuildingKey = keyof typeof BUILDING_URL;

// Preload all 7 GLBs at module load so the first render is instant
for (const url of Object.values(BUILDING_URL)) {
  useGLTF.preload(url);
}
