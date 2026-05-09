import { useMemo } from "react";

export type PotColor = "ceramic" | "terracotta" | "white" | "cardboard" | "darkGrey";

const POT_PALETTE: Record<PotColor, { body: string; rim: string; soil: string }> = {
  ceramic:    { body: "#9ca3af", rim: "#cbd5e1", soil: "#3b1d10" },
  terracotta: { body: "#a16d4d", rim: "#c08566", soil: "#3b1d10" },
  white:      { body: "#e5e7eb", rim: "#f3f4f6", soil: "#2c180c" },
  cardboard:  { body: "#a8754d", rim: "#8a5d3d", soil: "#2c180c" },
  darkGrey:   { body: "#4b5563", rim: "#6b7280", soil: "#1f1107" },
};

type Props = {
  color: PotColor;
  position?: [number, number, number];
  scale?: number;
};

export default function Pot({ color, position = [0, 0, 0], scale = 1 }: Props) {
  const palette = useMemo(() => POT_PALETTE[color], [color]);
  const r = 0.16 * scale;
  const rTop = 0.18 * scale;
  const h = 0.22 * scale;

  return (
    <group position={position}>
      {/* body */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[rTop, r, h, 16]} />
        <meshStandardMaterial color={palette.body} roughness={0.85} metalness={0.05} />
      </mesh>
      {/* rim */}
      <mesh position={[0, h - 0.005, 0]} castShadow>
        <torusGeometry args={[rTop, 0.018 * scale, 6, 18]} />
        <meshStandardMaterial color={palette.rim} roughness={0.7} />
      </mesh>
      {/* soil disk just under the rim */}
      <mesh position={[0, h - 0.012, 0]}>
        <cylinderGeometry args={[rTop * 0.92, rTop * 0.92, 0.008, 14]} />
        <meshStandardMaterial color={palette.soil} roughness={1.0} />
      </mesh>
    </group>
  );
}

export function potHeight(scale: number = 1) {
  return 0.22 * scale;
}
