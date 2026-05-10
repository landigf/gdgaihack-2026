# 3D plant assets — attribution

All models are shipped as self-contained `.glb` files (textures embedded).
Conversion done locally with `npx obj2gltf -i ... -o ... --embed`. No
remote runtime fetch — the GLBs sit next to the buildings under
`src/ares/3d/assets/plants/` and are imported via Vite `?url`.

| File | Author | License | Source URL |
|---|---|---|---|
| `tomato.glb` | _Sketchfab — see model page_ | CC-BY 4.0 | https://sketchfab.com/3d-models/tomato-plant-e0b559690e384fc0a9f3a05913f609c4 |
| `lettuce.glb` | _Sketchfab — see model page_ | CC-BY 4.0 | https://skfb.ly/ozsUT |
| `pepper.glb`  | _Sketchfab — see model page_ | CC-BY 4.0 | https://skfb.ly/pEITq |
| `mizuna.glb`  | _no GLB shipped — falls back to procedural rendering_ | — | — |

## Required attribution text (per CC-BY 4.0)

When publishing screenshots or videos that feature these models, include
the credits in either the description or a visible end-card:

> Tomato plant 3D model — Sketchfab CC-BY 4.0,
> https://sketchfab.com/3d-models/tomato-plant-e0b559690e384fc0a9f3a05913f609c4

## Re-build any asset from source

See `convert.sh` in this folder. Drop a fresh Sketchfab `.zip` into
`~/Downloads/` and run:

```bash
bash src/ares/3d/assets/plants/_source/convert.sh tomato ~/Downloads/tomato-plant.zip
```
