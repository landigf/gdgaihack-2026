import { useState } from "react";

type Props = {
  position: [number, number, number];
  onClick?: () => void;
};

export default function BuildingRoverGarage({ position, onClick }: Props) {
  const [hover, setHover] = useState(false);
  const accent = hover ? "#fbbf24" : "#94a3b8";

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
        <boxGeometry args={[2.6, 0.1, 1.6]} />
        <meshStandardMaterial color="#3b3b40" roughness={0.8} />
      </mesh>

      {/* Open garage shell — half-cylinder */}
      <mesh position={[0, 0.7, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.7, 0.7, 2.2, 16, 1, true, 0, Math.PI]} />
        <meshStandardMaterial color="#475569" side={2} roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Floor */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[2.2, 0.05, 1.2]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Rover sticking out — body */}
      <group position={[0.6, 0.35, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.3, 0.6]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.4} />
        </mesh>
        {/* solar lid */}
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.7, 0.04, 0.5]} />
          <meshStandardMaterial color="#1e3a8a" emissive={accent} emissiveIntensity={0.2} metalness={0.7} />
        </mesh>
        {/* 4 wheels */}
        {[
          [-0.3, -0.18, 0.32],
          [0.3, -0.18, 0.32],
          [-0.3, -0.18, -0.32],
          [0.3, -0.18, -0.32],
        ].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.08, 12]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
        ))}
      </group>
    </group>
  );
}
