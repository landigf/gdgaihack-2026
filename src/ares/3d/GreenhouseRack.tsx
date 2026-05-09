import { useState } from "react";
import { Html } from "@react-three/drei";
import Plant, { stageName, type PlantSpecies, type PlantStage } from "./PlantStages";

export type Tray = {
  id: number;
  species: PlantSpecies;
  label: string; // e.g. "Outredgeous lettuce"
  stage: PlantStage;
  progressInStage: number; // 0..1
  ndvi: number; // 0..1
  ec: number; // mS/cm
  ph: number;
  ppfd: number; // μmol/m²/s
  moisture: number; // 0..1
  daysToHarvest: number;
};

type Props = {
  trays: Tray[];
  selectedTrayId: number | null;
  onSelectTray: (id: number) => void;
};

const SHELF_Y = [0, 0.55, 1.1, 1.65];
const PLANTS_PER_TRAY: Array<[number, number]> = [
  [-0.45, 0.08],
  [-0.15, -0.08],
  [0.15, 0.08],
  [0.45, -0.08],
  [-0.3, -0.16],
  [0.3, 0.16],
];

function trayColor(tray: Tray) {
  if (tray.stage === 5) return "#10b981";
  if (tray.stage >= 3) return "#fbbf24";
  if (tray.stage >= 1) return "#22d3ee";
  return "#475569";
}

export default function GreenhouseRack({ trays, selectedTrayId, onSelectTray }: Props) {
  const [hoverTray, setHoverTray] = useState<number | null>(null);

  return (
    <group position={[0, 0, 0]}>
      {/* Floor */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[3.2, 0.05, 2.0]} />
        <meshStandardMaterial color="#1e1b1b" roughness={0.9} />
      </mesh>

      {/* Vertical posts */}
      {[
        [-1.4, 0.95, -0.85],
        [1.4, 0.95, -0.85],
        [-1.4, 0.95, 0.85],
        [1.4, 0.95, 0.85],
      ].map(([x, y, z], i) => (
        <mesh key={`post-${i}`} position={[x, y, z]}>
          <boxGeometry args={[0.06, 1.9, 0.06]} />
          <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}

      {SHELF_Y.map((y, idx) => {
        const tray = trays[idx];
        if (!tray) return null;
        const selected = selectedTrayId === tray.id;
        const hovered = hoverTray === tray.id;
        const accent = trayColor(tray);

        return (
          <group key={`shelf-${idx}`} position={[0, y, 0]}>
            {/* Shelf plate */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.7, 0.04, 1.6]} />
              <meshStandardMaterial color="#1f2937" roughness={0.7} />
            </mesh>

            {/* Tray */}
            <group
              position={[0, 0.04, 0]}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoverTray(tray.id);
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                setHoverTray(null);
                document.body.style.cursor = "default";
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectTray(tray.id);
              }}
            >
              <mesh castShadow receiveShadow>
                <boxGeometry args={[2.4, 0.08, 1.3]} />
                <meshStandardMaterial
                  color="#3b2f25"
                  roughness={0.95}
                  emissive={selected ? accent : hovered ? "#fbbf24" : "#000"}
                  emissiveIntensity={selected ? 0.3 : hovered ? 0.2 : 0}
                />
              </mesh>

              {/* Plants in 2x3 grid */}
              {PLANTS_PER_TRAY.map(([px, pz], i) => (
                <Plant
                  key={`plant-${tray.id}-${i}`}
                  species={tray.species}
                  stage={tray.stage}
                  position={[px, 0.04, pz]}
                  jitter={(tray.id * 7 + i * 13) % 360}
                />
              ))}

              {/* Tray label tag (right side) */}
              <Html
                position={[1.32, 0.1, 0]}
                center
                distanceFactor={6}
                style={{
                  pointerEvents: "none",
                  background: "rgba(0,0,0,0.85)",
                  border: `1px solid ${accent}`,
                  borderRadius: 6,
                  padding: "5px 9px",
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 11,
                  color: accent,
                  whiteSpace: "nowrap",
                  textShadow: `0 0 6px ${accent}55`,
                }}
              >
                <div style={{ fontWeight: 600 }}>Tray {tray.id} · {tray.label}</div>
                <div style={{ color: "#cbd5e1", marginTop: 2 }}>
                  {stageName(tray.stage)} ({tray.stage}/5){tray.stage === 5 ? " · READY" : ""}
                </div>
              </Html>
            </group>

            {/* Grow-light strip above shelf */}
            <mesh position={[0, 0.45, 0]}>
              <boxGeometry args={[2.4, 0.04, 0.3]} />
              <meshStandardMaterial
                color="#1e1b4b"
                emissive="#a78bfa"
                emissiveIntensity={0.6}
              />
            </mesh>

            {/* Stage progress bar (front edge of shelf) */}
            <Html
              position={[-1.6, 0, 0.85]}
              distanceFactor={6}
              style={{
                pointerEvents: "none",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10,
                color: "#cbd5e1",
                background: "rgba(0,0,0,0.8)",
                padding: "3px 7px",
                borderRadius: 4,
                border: `1px solid ${accent}66`,
                whiteSpace: "nowrap",
              }}
            >
              {Array.from({ length: 6 }, (_, k) => (
                <span
                  key={k}
                  style={{
                    color: k <= tray.stage ? accent : "#374151",
                    marginRight: 1,
                  }}
                >
                  ▮
                </span>
              ))}
            </Html>
          </group>
        );
      })}
    </group>
  );
}
