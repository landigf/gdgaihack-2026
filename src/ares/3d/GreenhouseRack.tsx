import { useState } from "react";
import { Html } from "@react-three/drei";
import Plant, { stageName, type PlantSpecies, type PlantStage } from "./PlantStages";
import Pot, { type PotColor, potHeight } from "./Pot";
import WireMeshShelf from "./WireMeshShelf";

export type PotState = {
  id: string; // e.g. "shelf2.pot3"
  species: PlantSpecies;
  speciesLabel: string;
  potColor: PotColor;
  stage: PlantStage;
  progressInStage: number; // 0..1
  ndvi: number;
  ec: number;
  ph: number;
  ppfd: number;
  moisture: number;
  daysToHarvest: number;
};

export type Shelf = {
  id: number;
  species: PlantSpecies;
  speciesLabel: string;
  pots: PotState[];
};

type Props = {
  shelves: Shelf[];
  selectedPotId: string | null;
  onSelectPot: (id: string) => void;
};

const SHELF_Y = [0, 0.95, 1.9, 2.85];
const SHELF_W = 3.2;
const SHELF_D = 1.25;
const POT_X_POSITIONS = [-1.2, -0.4, 0.4, 1.2]; // 4 pots per shelf, breathing room

function shelfTone(shelf: Shelf): string {
  // Aggregate verdict color: green if any pot ready, amber if any flowering+, cyan otherwise
  const hasReady = shelf.pots.some((p) => p.stage === 5);
  if (hasReady) return "#10b981";
  const hasFlowering = shelf.pots.some((p) => p.stage >= 3);
  if (hasFlowering) return "#fbbf24";
  return "#22d3ee";
}

export default function GreenhouseRack({ shelves, selectedPotId, onSelectPot }: Props) {
  const [hoverPotId, setHoverPotId] = useState<string | null>(null);

  return (
    <group position={[0, 0, 0]}>
      {/* Floor */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[3.7, 0.05, 1.7]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.95} />
      </mesh>

      {/* 4 corner posts spanning all 4 shelves (taller now that shelves are spread) */}
      {[
        [-(SHELF_W / 2 + 0.02), 1.55, -(SHELF_D / 2 + 0.02)],
        [SHELF_W / 2 + 0.02, 1.55, -(SHELF_D / 2 + 0.02)],
        [-(SHELF_W / 2 + 0.02), 1.55, SHELF_D / 2 + 0.02],
        [SHELF_W / 2 + 0.02, 1.55, SHELF_D / 2 + 0.02],
      ].map(([x, y, z], i) => (
        <mesh key={`post-${i}`} position={[x, y, z]} castShadow>
          <boxGeometry args={[0.05, 3.15, 0.05]} />
          <meshStandardMaterial color="#0a0a0a" metalness={0.65} roughness={0.35} />
        </mesh>
      ))}

      {SHELF_Y.map((y, idx) => {
        const shelf = shelves[idx];
        if (!shelf) return null;
        const accent = shelfTone(shelf);

        return (
          <group key={`shelf-${idx}`} position={[0, y, 0]}>
            {/* Wire-mesh shelf surface */}
            <WireMeshShelf width={SHELF_W} depth={SHELF_D} />

            {/* Per-shelf species label tag (outside, on right side, billboarded) */}
            <Html
              position={[SHELF_W / 2 + 0.55, 0.35, 0]}
              center
              distanceFactor={9}
              style={{
                pointerEvents: "none",
                background: "rgba(0,0,0,0.92)",
                border: `1px solid ${accent}`,
                borderRadius: 6,
                padding: "4px 8px",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10,
                color: accent,
                whiteSpace: "nowrap",
                fontWeight: 600,
                textShadow: `0 0 6px ${accent}55`,
              }}
            >
              <div>SHELF {shelf.id} · {shelf.speciesLabel}</div>
              <div style={{ color: "#94a3b8", fontSize: 8, marginTop: 1 }}>
                {shelf.pots.filter((p) => p.stage === 5).length}/{shelf.pots.length} READY
              </div>
            </Html>

            {/* 4 pots */}
            {shelf.pots.map((pot, i) => {
              const x = POT_X_POSITIONS[i] ?? (i - 1.5) * 0.65;
              const selected = selectedPotId === pot.id;
              const hovered = hoverPotId === pot.id;
              const yPotBase = 0.012; // sit on top of the shelf wires
              const ph = potHeight(1);
              return (
                <group
                  key={pot.id}
                  position={[x, yPotBase, 0]}
                  onPointerOver={(e) => {
                    e.stopPropagation();
                    setHoverPotId(pot.id);
                    document.body.style.cursor = "pointer";
                  }}
                  onPointerOut={() => {
                    setHoverPotId(null);
                    document.body.style.cursor = "default";
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPot(pot.id);
                  }}
                >
                  {/* Click highlight ring (small disc under the pot) */}
                  {(selected || hovered) && (
                    <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                      <ringGeometry args={[0.21, 0.27, 24]} />
                      <meshBasicMaterial
                        color={selected ? "#fbbf24" : "#94a3b8"}
                        transparent
                        opacity={selected ? 0.85 : 0.4}
                      />
                    </mesh>
                  )}

                  <Pot color={pot.potColor} />

                  {/* Plant on top of soil (top of pot at ph) */}
                  <Plant
                    species={pot.species}
                    stage={pot.stage}
                    position={[0, ph, 0]}
                    jitter={(shelf.id * 13 + i * 7) % 360}
                  />

                  {/* READY badge — small, above the plant top */}
                  {pot.stage === 5 && (
                    <Html
                      position={[0, ph + 0.55, 0]}
                      center
                      distanceFactor={11}
                      style={{
                        pointerEvents: "none",
                        background: "rgba(16,185,129,0.95)",
                        color: "#0a0a0a",
                        padding: "1px 4px",
                        fontSize: 8,
                        fontWeight: 700,
                        borderRadius: 3,
                        whiteSpace: "nowrap",
                        fontFamily: "JetBrains Mono, monospace",
                        textShadow: "none",
                        letterSpacing: 0.5,
                      }}
                    >
                      READY
                    </Html>
                  )}
                </group>
              );
            })}

            {/* Grow-light strip above shelf — moved higher to give clearance */}
            <mesh position={[0, 0.78, 0]}>
              <boxGeometry args={[SHELF_W * 0.95, 0.03, 0.22]} />
              <meshStandardMaterial
                color="#1e1b4b"
                emissive="#a78bfa"
                emissiveIntensity={0.7}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export { stageName };
export type { PlantStage };
