import { useState } from "react";

type Props = {
  position: [number, number, number];
  onClick?: () => void;
};

const KILOPOWER_COUNT = 5;

export default function BuildingPower({ position, onClick }: Props) {
  const [hover, setHover] = useState(false);
  const accent = hover ? "#fbbf24" : "#a78bfa";

  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "default";
      }}
      onClick={onClick}
    >
      {/* Pad */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[4.0, 0.1, 3.0]} />
        <meshStandardMaterial color="#3b3b40" roughness={0.8} />
      </mesh>

      {/* Solar field — 3 panels in a row */}
      {[-1.0, 0, 1.0].map((x, i) => (
        <group key={`solar-${i}`} position={[x, 0.7, -0.9]}>
          <mesh castShadow rotation={[-Math.PI / 6, 0, 0]}>
            <boxGeometry args={[0.85, 0.04, 1.0]} />
            <meshStandardMaterial color="#1e3a8a" metalness={0.7} roughness={0.3} emissive="#3b82f6" emissiveIntensity={0.15} />
          </mesh>
          {/* support */}
          <mesh position={[0, -0.35, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.7, 6]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        </group>
      ))}

      {/* 5 Kilopower cores in a row, in front */}
      {Array.from({ length: KILOPOWER_COUNT }).map((_, i) => {
        const x = (i - (KILOPOWER_COUNT - 1) / 2) * 0.55;
        return (
          <group key={`kp-${i}`} position={[x, 0.4, 0.9]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.18, 0.22, 0.7, 12]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.5} />
            </mesh>
            <mesh position={[0, 0.4, 0]}>
              <coneGeometry args={[0.18, 0.3, 12]} />
              <meshStandardMaterial color="#a78bfa" emissive={accent} emissiveIntensity={0.7} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
