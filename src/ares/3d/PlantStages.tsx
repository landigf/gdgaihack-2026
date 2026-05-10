import { useMemo } from "react";
import { Clone, useGLTF } from "@react-three/drei";
import { PLANT_TRANSFORM, PLANT_URLS } from "./plantUrls";

export type PlantStage = 0 | 1 | 2 | 3 | 4 | 5;
export type PlantSpecies = "lettuce" | "mizuna" | "pepper" | "tomato";

// Stage → outer scale multiplier for the GLB plant. Stage 0 stays
// hidden (we already render a small dirt mound below). Stage 5 is the
// reference scale tuned in PLANT_TRANSFORM.<species>.scaleMul.
const STAGE_GROW: Record<Exclude<PlantStage, 0>, number> = {
  1: 0.30,
  2: 0.55,
  3: 0.75,
  4: 0.90,
  5: 1.0,
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
 * Plant — distinct silhouettes per species so a 4-shelf rack reads varied:
 *   lettuce  → low rosette of overlapping flat half-spheres
 *   mizuna   → tall frilly leaves, vertical strips, red tipped at maturity
 *   pepper   → bushy with rounded canopy + green→red fruits
 *   tomato   → vertical with red fruit clusters
 */
export default function Plant({ species, stage, position = [0, 0, 0], jitter = 0 }: Props) {
  const yRot = ((jitter * 137.5) % 360) * (Math.PI / 180);
  const t = stage / 5;

  // Stage 0 = bare soil bump (looks identical across species)
  if (stage === 0) {
    return (
      <mesh position={position} castShadow>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color="#3b1d10" roughness={0.95} />
      </mesh>
    );
  }

  // GLB path: if we have a downloaded model for this species, use it.
  // Otherwise fall through to the procedural sub-components below.
  // Allows incremental rollout — tomato GLB ships first, the rest stay
  // procedural until their assets land in src/ares/3d/assets/plants/.
  const glbUrl = PLANT_URLS[species];
  if (glbUrl) {
    return (
      <GLBPlant
        url={glbUrl}
        species={species}
        stage={stage}
        position={position}
        yRot={yRot}
      />
    );
  }

  // Common scale
  const grow = 0.3 + t * 0.7;

  if (species === "lettuce") {
    return (
      <Lettuce position={position} stage={stage} grow={grow} yRot={yRot} jitter={jitter} />
    );
  }
  if (species === "mizuna") {
    return (
      <Mizuna position={position} stage={stage} grow={grow} yRot={yRot} jitter={jitter} />
    );
  }
  if (species === "pepper") {
    return (
      <Pepper position={position} stage={stage} grow={grow} yRot={yRot} jitter={jitter} />
    );
  }
  return <Tomato position={position} stage={stage} grow={grow} yRot={yRot} jitter={jitter} />;
}

// ---------------------------------------------------------------------------
// Per-species components
// ---------------------------------------------------------------------------

type SubProps = {
  position: [number, number, number];
  stage: PlantStage;
  grow: number;
  yRot: number;
  jitter: number;
};

function Lettuce({ position, stage, grow, yRot, jitter }: SubProps) {
  const leafCount = stage === 1 ? 3 : stage === 2 ? 5 : 7;
  const leafR = 0.05 + grow * 0.07;
  const tipColor = stage >= 4 ? "#7ab85b" : "#7fc24a"; // mature: slightly redder
  const baseColor = "#5fa53a";

  const leaves = useMemo(() => {
    return Array.from({ length: leafCount }).map((_, i) => {
      const angle = (i / leafCount) * Math.PI * 2 + (jitter % 10) * 0.1;
      const r = 0.04 + grow * 0.02;
      const tilt = -Math.PI / 2.2 + (i % 2) * 0.15;
      return { angle, r, tilt };
    });
  }, [leafCount, grow, jitter]);

  return (
    <group position={position} rotation={[0, yRot, 0]}>
      {/* central whorl */}
      <mesh position={[0, leafR * 0.4, 0]} castShadow>
        <sphereGeometry args={[leafR * 0.55, 12, 8]} />
        <meshStandardMaterial color={baseColor} roughness={0.7} />
      </mesh>
      {/* outer leaves — flattened spheres at low angles */}
      {leaves.map((l, i) => (
        <mesh
          key={i}
          position={[Math.cos(l.angle) * l.r, leafR * 0.35, Math.sin(l.angle) * l.r]}
          rotation={[l.tilt, l.angle, 0]}
          castShadow
          scale={[1, 0.4, 1]}
        >
          <sphereGeometry args={[leafR, 10, 6]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? tipColor : baseColor}
            roughness={0.7}
            emissive={tipColor}
            emissiveIntensity={stage === 5 ? 0.18 : 0.06}
          />
        </mesh>
      ))}
      {stage === 5 && (
        <mesh position={[0, leafR * 0.7, 0]}>
          <sphereGeometry args={[leafR * 0.9, 12, 8]} />
          <meshStandardMaterial color="#9bc55e" roughness={0.6} emissive="#9bc55e" emissiveIntensity={0.25} />
        </mesh>
      )}
    </group>
  );
}

function Mizuna({ position, stage, grow, yRot, jitter }: SubProps) {
  const stripCount = 6 + stage * 2;
  const stripH = 0.05 + grow * 0.32;
  const tipRed = stage >= 4 ? "#c2410c" : "#dc2626"; // brighter red at fruiting
  const leafGreen = "#22543d";
  const strips = useMemo(() => {
    return Array.from({ length: stripCount }).map((_, i) => {
      const angle = (i / stripCount) * Math.PI * 2 + (jitter % 7) * 0.05;
      const r = 0.02 + Math.random() * 0.025; // tiny radial spread (deterministic-ish via jitter would be better)
      return { angle, r, h: stripH * (0.7 + ((i * 13 + jitter) % 30) / 100) };
    });
  }, [stripCount, stripH, jitter]);

  return (
    <group position={position} rotation={[0, yRot, 0]}>
      {/* stem cluster */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.018, 0.022, 0.04, 6]} />
        <meshStandardMaterial color={leafGreen} />
      </mesh>
      {/* tall thin frilly strips */}
      {strips.map((s, i) => {
        const x = Math.cos(s.angle) * s.r;
        const z = Math.sin(s.angle) * s.r;
        const tipY = s.h * 0.92;
        return (
          <group key={i} position={[x, 0, z]} rotation={[0, s.angle, 0]}>
            {/* leaf strip */}
            <mesh position={[0, s.h / 2, 0]} castShadow>
              <boxGeometry args={[0.012, s.h, 0.045]} />
              <meshStandardMaterial color={leafGreen} roughness={0.7} />
            </mesh>
            {/* red tip — only on mature stages */}
            {stage >= 3 && (
              <mesh position={[0, tipY, 0]} castShadow>
                <boxGeometry args={[0.014, s.h * 0.18, 0.05]} />
                <meshStandardMaterial color={tipRed} roughness={0.65} emissive={tipRed} emissiveIntensity={stage === 5 ? 0.4 : 0.18} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

function Pepper({ position, stage, grow, yRot, jitter }: SubProps) {
  const stemH = 0.06 + grow * 0.18;
  const canopyR = 0.07 + grow * 0.12;
  const fruitCount = stage === 5 ? 5 : stage === 4 ? 3 : stage === 3 ? 1 : 0;
  const fruitColor = stage === 5 ? "#dc2626" : "#16a34a";
  const fruits = useMemo(() => {
    return Array.from({ length: fruitCount }).map((_, i) => {
      const angle = (i / Math.max(1, fruitCount)) * Math.PI * 2 + 0.5 + (jitter % 5) * 0.07;
      return { angle, drop: -0.02 - (i % 2) * 0.015 };
    });
  }, [fruitCount, jitter]);

  return (
    <group position={position} rotation={[0, yRot, 0]}>
      {/* stem */}
      <mesh position={[0, stemH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.014, 0.02, stemH, 6]} />
        <meshStandardMaterial color="#15803d" roughness={0.85} />
      </mesh>
      {/* leaf canopy */}
      <mesh position={[0, stemH + canopyR * 0.4, 0]} castShadow>
        <sphereGeometry args={[canopyR, 14, 10]} />
        <meshStandardMaterial color="#16a34a" roughness={0.7} />
      </mesh>
      {/* a couple of side leaves */}
      <mesh position={[canopyR * 0.5, stemH + canopyR * 0.3, 0]} castShadow scale={[1, 0.5, 1]}>
        <sphereGeometry args={[canopyR * 0.6, 10, 8]} />
        <meshStandardMaterial color="#22c55e" roughness={0.7} />
      </mesh>
      <mesh position={[-canopyR * 0.5, stemH + canopyR * 0.3, 0]} castShadow scale={[1, 0.5, 1]}>
        <sphereGeometry args={[canopyR * 0.6, 10, 8]} />
        <meshStandardMaterial color="#22c55e" roughness={0.7} />
      </mesh>
      {/* fruits dangling under the canopy */}
      {fruits.map((f, i) => {
        const x = Math.cos(f.angle) * canopyR * 0.55;
        const z = Math.sin(f.angle) * canopyR * 0.55;
        return (
          <mesh
            key={i}
            position={[x, stemH + canopyR * 0.3 + f.drop, z]}
            castShadow
          >
            <sphereGeometry args={[0.025, 10, 8]} />
            <meshStandardMaterial
              color={fruitColor}
              roughness={0.45}
              emissive={fruitColor}
              emissiveIntensity={stage === 5 ? 0.35 : 0.12}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Tomato({ position, stage, grow, yRot, jitter }: SubProps) {
  const stemH = 0.08 + grow * 0.34;
  const clusterR = 0.04 + grow * 0.05;
  const fruitCount = stage === 5 ? 6 : stage === 4 ? 4 : stage === 3 ? 2 : 0;
  const fruitColor = stage === 5 ? "#ef4444" : stage === 4 ? "#f97316" : "#22c55e";
  const fruits = useMemo(() => {
    return Array.from({ length: fruitCount }).map((_, i) => {
      const angle = (i / Math.max(1, fruitCount)) * Math.PI * 2 + (jitter % 9) * 0.08;
      const yLevel = stemH * 0.55 + (i % 2) * 0.06;
      return { angle, yLevel };
    });
  }, [fruitCount, stemH, jitter]);

  return (
    <group position={position} rotation={[0, yRot, 0]}>
      {/* main stem */}
      <mesh position={[0, stemH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.013, 0.018, stemH, 6]} />
        <meshStandardMaterial color="#166534" roughness={0.85} />
      </mesh>
      {/* sparse leaves at 2 levels */}
      {[stemH * 0.55, stemH * 0.85].map((yL, k) => (
        <group key={k} position={[0, yL, 0]}>
          {[0, Math.PI].map((rot, j) => (
            <mesh
              key={j}
              position={[Math.cos(rot) * 0.04, 0, Math.sin(rot) * 0.04]}
              rotation={[0, rot, 0]}
              castShadow
              scale={[1.3, 0.3, 0.6]}
            >
              <sphereGeometry args={[0.05, 10, 6]} />
              <meshStandardMaterial color="#22c55e" roughness={0.7} />
            </mesh>
          ))}
        </group>
      ))}
      {/* top tuft */}
      <mesh position={[0, stemH + 0.02, 0]} castShadow>
        <sphereGeometry args={[clusterR * 0.7, 10, 8]} />
        <meshStandardMaterial color="#22c55e" roughness={0.7} />
      </mesh>
      {/* fruit clusters dangling */}
      {fruits.map((f, i) => {
        const x = Math.cos(f.angle) * clusterR * 1.4;
        const z = Math.sin(f.angle) * clusterR * 1.4;
        const fr = stage === 5 ? 0.034 : 0.025;
        return (
          <mesh key={i} position={[x, f.yLevel, z]} castShadow>
            <sphereGeometry args={[fr, 12, 10]} />
            <meshStandardMaterial
              color={fruitColor}
              roughness={0.4}
              emissive={fruitColor}
              emissiveIntensity={stage === 5 ? 0.4 : 0.15}
            />
          </mesh>
        );
      })}
    </group>
  );
}


// ---------------------------------------------------------------------------
// GLB-backed plant — used when PLANT_URLS[species] resolves to a real
// downloaded model. Stage drives an outer scale ramp; the per-species
// PLANT_TRANSFORM.<species> tunes for source-axis quirks (centimeter
// units in the Sketchfab tomato, etc.).
// ---------------------------------------------------------------------------

function GLBPlant({
  url,
  species,
  stage,
  position,
  yRot,
}: {
  url: string;
  species: PlantSpecies;
  stage: PlantStage;
  position: [number, number, number];
  yRot: number;
}) {
  const { scene } = useGLTF(url);
  // Clone once per pot so each instance has its own transforms (drei's
  // <Clone> handles material sharing internally — no GPU duplication).
  const cloned = useMemo(() => scene.clone(true), [scene]);

  if (stage === 0) return null;
  const grow = STAGE_GROW[stage];

  const t = PLANT_TRANSFORM[species];
  const scaleMul = t?.scaleMul ?? 1;
  const yOffset = t?.yOffset ?? 0;
  const rotYExtra = t?.rotY ?? 0;

  const finalScale = scaleMul * grow;

  return (
    <Clone
      object={cloned}
      position={[position[0], position[1] + yOffset, position[2]]}
      scale={[finalScale, finalScale, finalScale]}
      rotation={[0, yRot + rotYExtra, 0]}
    />
  );
}
