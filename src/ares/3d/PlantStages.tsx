import { useMemo } from "react";

export type PlantStage = 0 | 1 | 2 | 3 | 4 | 5;

export type PlantSpecies = "lettuce" | "mizuna" | "pepper" | "tomato";

const SPECIES_PALETTE: Record<
  PlantSpecies,
  { stem: string; leaf: string; fruit?: string; flower?: string }
> = {
  lettuce: { stem: "#3b8a3a", leaf: "#7ab85b" }, // light romaine green
  mizuna: { stem: "#22543d", leaf: "#dc2626", flower: "#fef3c7" }, // red-tipped mustard
  pepper: { stem: "#166534", leaf: "#16a34a", fruit: "#dc2626", flower: "#fef9c3" },
  tomato: { stem: "#15803d", leaf: "#22c55e", fruit: "#ef4444", flower: "#fde68a" },
};

const STAGE_NAMES = [
  "Germination",
  "Seedling",
  "Vegetative",
  "Flowering",
  "Fruiting",
  "Ready",
];

export function stageName(s: PlantStage) {
  return STAGE_NAMES[s];
}

type Props = {
  species: PlantSpecies;
  stage: PlantStage;
  position?: [number, number, number];
  jitter?: number;
};

/**
 * Procedural plant. Combines a stem cone + leaf sphere + (optionally) flowers + fruits.
 * Visibly different at every stage; deterministic per-jitter so layout stays stable.
 */
export default function Plant({ species, stage, position = [0, 0, 0], jitter = 0 }: Props) {
  const palette = SPECIES_PALETTE[species];

  const { stemH, stemR, leafR, fruitCount, flowerCount } = useMemo(() => {
    // Each stage scales geometry up to convey growth
    const t = stage / 5;
    return {
      stemH: 0.04 + t * (species === "tomato" ? 0.42 : species === "pepper" ? 0.36 : 0.18),
      stemR: 0.012 + t * 0.025,
      leafR: stage === 0 ? 0.02 : 0.05 + t * (species === "lettuce" || species === "mizuna" ? 0.22 : 0.12),
      fruitCount: stage >= 4 && (species === "tomato" || species === "pepper") ? Math.min(stage - 3, 2) * (stage === 5 ? 4 : 2) : 0,
      flowerCount: stage >= 3 && stage < 5 ? 2 : stage === 5 && species === "mizuna" ? 4 : 0,
    };
  }, [stage, species]);

  // small rotation jitter per plant for natural look
  const yRot = (jitter * 137.5) % 360;

  if (stage === 0) {
    // just a tiny bump (germination)
    return (
      <mesh position={position} castShadow>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color="#6b3410" roughness={0.95} />
      </mesh>
    );
  }

  return (
    <group position={position} rotation={[0, (yRot * Math.PI) / 180, 0]}>
      {/* soil bump */}
      <mesh position={[0, 0.005, 0]} receiveShadow>
        <cylinderGeometry args={[0.07, 0.08, 0.01, 8]} />
        <meshStandardMaterial color="#3b1d10" />
      </mesh>

      {/* stem */}
      <mesh position={[0, stemH / 2, 0]} castShadow>
        <cylinderGeometry args={[stemR * 0.7, stemR, stemH, 6]} />
        <meshStandardMaterial color={palette.stem} roughness={0.85} />
      </mesh>

      {/* leaf canopy */}
      <mesh position={[0, stemH + leafR * 0.6, 0]} castShadow>
        <sphereGeometry args={[leafR, 12, 8]} />
        <meshStandardMaterial
          color={palette.leaf}
          roughness={0.7}
          emissive={palette.leaf}
          emissiveIntensity={stage === 5 ? 0.18 : 0.08}
        />
      </mesh>

      {/* extra puff for lettuce/mizuna at later stages — they look "leafy" */}
      {(species === "lettuce" || species === "mizuna") && stage >= 2 && (
        <>
          <mesh position={[leafR * 0.4, stemH + leafR * 0.4, 0]} castShadow>
            <sphereGeometry args={[leafR * 0.7, 10, 8]} />
            <meshStandardMaterial color={palette.leaf} roughness={0.7} />
          </mesh>
          <mesh position={[-leafR * 0.4, stemH + leafR * 0.4, 0]} castShadow>
            <sphereGeometry args={[leafR * 0.7, 10, 8]} />
            <meshStandardMaterial color={palette.leaf} roughness={0.7} />
          </mesh>
          {stage >= 4 && (
            <mesh position={[0, stemH + leafR * 1.05, 0]} castShadow>
              <sphereGeometry args={[leafR * 0.65, 10, 8]} />
              <meshStandardMaterial color={palette.leaf} roughness={0.7} />
            </mesh>
          )}
        </>
      )}

      {/* flowers (small white/yellow puffs) */}
      {Array.from({ length: flowerCount }).map((_, i) => {
        const angle = (i / Math.max(1, flowerCount)) * Math.PI * 2;
        const r = leafR * 0.85;
        return (
          <mesh
            key={`fl-${i}`}
            position={[Math.cos(angle) * r, stemH + leafR * 0.7, Math.sin(angle) * r]}
            castShadow
          >
            <sphereGeometry args={[0.018, 6, 6]} />
            <meshStandardMaterial
              color={palette.flower || "#fef3c7"}
              emissive={palette.flower || "#fef3c7"}
              emissiveIntensity={0.4}
            />
          </mesh>
        );
      })}

      {/* fruits (red/orange) */}
      {Array.from({ length: fruitCount }).map((_, i) => {
        const angle = (i / Math.max(1, fruitCount)) * Math.PI * 2 + 0.4;
        const r = leafR * 0.7;
        const fruitR = stage === 5 ? 0.04 : 0.025;
        return (
          <mesh
            key={`fr-${i}`}
            position={[
              Math.cos(angle) * r,
              stemH + leafR * 0.35 - 0.01,
              Math.sin(angle) * r,
            ]}
            castShadow
          >
            <sphereGeometry args={[fruitR, 10, 8]} />
            <meshStandardMaterial
              color={palette.fruit || "#dc2626"}
              roughness={0.4}
              metalness={0.05}
              emissive={palette.fruit || "#dc2626"}
              emissiveIntensity={stage === 5 ? 0.25 : 0.1}
            />
          </mesh>
        );
      })}
    </group>
  );
}
