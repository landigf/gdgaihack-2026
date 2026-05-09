import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

type Props = {
  position: [number, number, number];
  ch4FillPct?: number;
  onClick?: () => void;
};

export default function BuildingISRU({ position, ch4FillPct = 0.3, onClick }: Props) {
  const [hover, setHover] = useState(false);
  const fillRef = useRef<Mesh>(null);
  const accent = hover ? "#fbbf24" : "#fb923c";

  useFrame(() => {
    if (!fillRef.current) return;
    const target = Math.max(0.05, Math.min(0.95, ch4FillPct));
    fillRef.current.scale.y += (target - fillRef.current.scale.y) * 0.05;
    fillRef.current.position.y = -0.6 + (target * 1.2) / 2 + 0.6;
  });

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
        <boxGeometry args={[3.0, 0.1, 2.0]} />
        <meshStandardMaterial color="#3b3b40" roughness={0.8} />
      </mesh>

      {/* Tall reactor cylinder (Sabatier reactor) */}
      <mesh position={[-0.8, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.5, 2.0, 16]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* hot core */}
      <mesh position={[-0.8, 1.1, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 1.7, 12]} />
        <meshStandardMaterial color="#dc2626" emissive="#ef4444" emissiveIntensity={0.7} transparent opacity={0.7} />
      </mesh>

      {/* CH4 storage tank — rounded */}
      <mesh position={[0.7, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 1.6, 20]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Tank fill (animates) */}
      <mesh ref={fillRef} position={[0.7, 0.6, 0]} scale={[1, 0.3, 1]}>
        <cylinderGeometry args={[0.5, 0.5, 1.2, 20]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} transparent opacity={0.55} />
      </mesh>
      {/* Tank top dome */}
      <mesh position={[0.7, 1.7, 0]}>
        <sphereGeometry args={[0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.5} />
      </mesh>

      {/* connecting pipe */}
      <mesh position={[-0.05, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 1.5, 8]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
    </group>
  );
}
