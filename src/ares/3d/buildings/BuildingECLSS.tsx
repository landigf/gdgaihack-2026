import { useState } from "react";

type Props = {
  position: [number, number, number];
  onClick?: () => void;
};

export default function BuildingECLSS({ position, onClick }: Props) {
  const [hover, setHover] = useState(false);
  const accent = hover ? "#fbbf24" : "#38bdf8";

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
        <boxGeometry args={[2.4, 0.1, 1.6]} />
        <meshStandardMaterial color="#3b3b40" roughness={0.8} />
      </mesh>

      {/* 3 racks side-by-side */}
      {[-0.7, 0, 0.7].map((x, i) => (
        <group key={i} position={[x, 0.1, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.55, 1.0, 1.2]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.4} roughness={0.5} />
          </mesh>
          {/* lamp on top */}
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[0.4, 0.05, 1.0]} />
            <meshStandardMaterial color="#1f2937" emissive={accent} emissiveIntensity={0.5} />
          </mesh>
          {/* pipe */}
          <mesh position={[0, 0.3, 0.62]}>
            <torusGeometry args={[0.08, 0.03, 6, 12]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
