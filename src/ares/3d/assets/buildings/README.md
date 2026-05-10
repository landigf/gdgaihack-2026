# Mars-base buildings · low-poly GLB pack

7 stylized low-poly Mars-base buildings, drop-in replacements for the procedural
`<mesh>` primitives currently in `src/ares/3d/buildings/*.tsx` (target branch
`feature/ares-mars`).

## Files

| File | Bbox W×H×D (m) | Size | Tris | Highlights |
|---|---|---:|---:|---|
| `habitat.glb` | 2.3 × 1.9 × 1.4 | 26 KB | 1056 | pressure ribs + landing feet + gridded roof solar + antenna + docking collar |
| `greenhouse.glb` | 2.4 × 1.3 × 2.4 | 45 KB | 2040 | translucent green dome + ribs + floor rings + racks + grow lights |
| `eclss.glb` | 2.4 × 1.2 × 1.5 | 21 KB | 536 | 3 grey racks + grilles + cyan status strips + top duct + pipes |
| `isru.glb` | 2.8 × 2.4 × 1.4 | 27 KB | 1348 | reactor stack + orange valves + glowing slots + CH4 tank + pipe network |
| `power.glb` | 3.6 × 0.9 × 2.2 | 37 KB | 1332 | gridded solar panels + feeder cables + 5 Kilopower cylinders with purple rings |
| `airlock.glb` | 1.1 × 1.2 × 1.0 | 23 KB | 868 | hatch stripes + handrails + yellow chamber + emissive caution lamp |
| `rover_garage.glb` | 1.6 × 1.4 × 1.6 | 21 KB | 632 | ramp + side rails + rover hubs + camera mast + arched shell |

Total: **~200 KB for all 7 files**, well under the 500 KB-per-file budget.
All triangle counts are inside the 500–2000 target.

## Conventions

- **Up axis**: Y-up.
- **Origin**: each model's pivot is at `(x=0, y=0, z=0)` with the **base sitting
  on the ground** (so you can place the model with `position={[x, 0, z]}` and
  it'll rest on the Mars surface).
- **Forward face**: `-Z` (matches three.js convention).
- **PBR materials**: each model carries 3–6 named PBR materials (baseColor,
  metallic, roughness, emissive when relevant). All factors only — no external
  textures, no atlases. Materials are embedded in the binary GLB.
- **Translucency**: `greenhouse.glb` dome uses `alphaMode = "BLEND"`,
  `doubleSided = true`. Make sure your renderer has `transparent: true` on
  that material if you re-derive a Three material from the GLTF (drei's
  `useGLTF` does this automatically).
- **Emissive**: `isru.glb` (red core glow), `power.glb` (purple reactor rings),
  `airlock.glb` (yellow lamp), `eclss.glb` (cyan LED stripes), `rover_garage.glb`
  (cyan front accent). Tune scene exposure / bloom to taste.

## ALERT_RING_ANCHOR

Every GLB contains an extra empty node called **`ALERT_RING_ANCHOR`** placed at
the top-center of the model (above the highest visible geometry, with a small
~0.1 m clearance). Use it to attach a runtime alert ring shader / sprite:

```tsx
import { useGLTF } from "@react-three/drei";

function Habitat({ alert }: { alert: boolean }) {
  const { scene } = useGLTF("/assets/buildings/habitat.glb");
  const anchor = scene.getObjectByName("ALERT_RING_ANCHOR");
  return (
    <group>
      <primitive object={scene} />
      {alert && anchor && (
        <group position={anchor.position}>
          <AlertRing />
        </group>
      )}
    </group>
  );
}

useGLTF.preload("/assets/buildings/habitat.glb");
```

## Source

Procedural generator at [`_source/generate_buildings.py`](./_source/generate_buildings.py)
— Python + `trimesh` + `pygltflib`. Re-run to regenerate (and tweak shapes /
colors / dimensions in one place):

```bash
pip install --user trimesh pygltflib numpy
python3 _source/generate_buildings.py .
```

## License

**CC0 1.0 Universal** — these are own procedural geometric work. No rights
reserved, public domain. Forks of CC0 sources (Quaternius, Kenney) are not
involved.
