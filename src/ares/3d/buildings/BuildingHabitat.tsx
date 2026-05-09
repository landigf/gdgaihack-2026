import { useState } from "react";
import AlertRing from "../AlertRing";

type Props = {
  position: [number, number, number];
  alert?: boolean;
  onClick?: () => void;
};

export default function BuildingHabitat({ position, alert, onClick }: Props) {
  const [hover, setHover] = useState(false);
  const accent = alert ? "#ef4444" : hover ? "#fbbf24" : "#cbd5e1";

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
      {alert && <AlertRing radius={2.2} color="#ef4444" />}

      {/* Pad */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[2.0, 2.0, 0.1, 24]} />
        <meshStandardMaterial color="#3b3b40" roughness={0.8} />
      </mesh>

      {/* Main horizontal cylinder body */}
      <mesh position={[0, 0.85, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 0.8, 2.4, 24]} />
        <meshStandardMaterial color="#e7e5e4" roughness={0.55} metalness={0.15} />
      </mesh>

      {/* End caps */}
      <mesh position={[1.2, 0.85, 0]} castShadow>
        <sphereGeometry args={[0.8, 24, 16, 0, Math.PI]} />
        <meshStandardMaterial color="#d6d3d1" roughness={0.55} />
      </mesh>
      <mesh position={[-1.2, 0.85, 0]} rotation={[0, Math.PI, 0]} castShadow>
        <sphereGeometry args={[0.8, 24, 16, 0, Math.PI]} />
        <meshStandardMaterial color="#d6d3d1" roughness={0.55} />
      </mesh>

      {/* Roof solar/comm strip */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <boxGeometry args={[1.6, 0.1, 0.5]} />
        <meshStandardMaterial color="#1f2937" emissive={accent} emissiveIntensity={hover ? 0.6 : 0.25} />
      </mesh>

      {/* Tiny antenna */}
      <mesh position={[0.4, 1.85, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0.4, 2.2, 0]} castShadow>
        <coneGeometry args={[0.08, 0.15, 8]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.8} />
      </mesh>

      {/* Window strip */}
      <mesh position={[0, 0.85, 0.81]}>
        <boxGeometry args={[1.8, 0.18, 0.02]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}
