import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Mesh } from "three";
import AlertRing from "../AlertRing";

type Props = {
  position: [number, number, number];
  ready?: boolean;
  onClick?: () => void;
};

export default function BuildingGreenhouse({ position, ready, onClick }: Props) {
  const [hover, setHover] = useState(false);
  const domeRef = useRef<Mesh>(null);
  const accent = ready ? "#10b981" : hover ? "#fbbf24" : "#22d3ee";

  useFrame((state) => {
    if (!domeRef.current) return;
    const t = state.clock.elapsedTime;
    const intensity = ready ? 0.4 + Math.sin(t * 2.5) * 0.25 : 0.15;
    (domeRef.current.material as any).emissiveIntensity = intensity;
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
      {ready && <AlertRing radius={1.6} color="#10b981" />}

      {/* Pad */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[1.4, 1.4, 0.1, 24]} />
        <meshStandardMaterial color="#3b3b40" roughness={0.8} />
      </mesh>

      {/* Inflatable dome (transparent shell) */}
      <mesh ref={domeRef} position={[0, 0.1, 0]} castShadow>
        <sphereGeometry args={[1.15, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#86efac"
          emissive={accent}
          emissiveIntensity={0.2}
          transparent
          opacity={0.85}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* Inner plant rack hint — 3 colored bars */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.4, 0.06, 0.6]} />
        <meshStandardMaterial color="#15803d" emissive="#22c55e" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[1.4, 0.06, 0.6]} />
        <meshStandardMaterial color="#16a34a" emissive="#34d399" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[1.4, 0.06, 0.6]} />
        <meshStandardMaterial color="#22c55e" emissive="#86efac" emissiveIntensity={0.6} />
      </mesh>

      {/* Click indicator on hover */}
      {hover && (
        <mesh position={[0, 2.0, 0]} rotation={[-Math.PI / 4, 0, 0]}>
          <coneGeometry args={[0.15, 0.3, 4]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      )}

      {/* Persistent floating label so the click target is obvious */}
      <Html
        position={[0, 2.2, 0]}
        center
        distanceFactor={9}
        style={{
          pointerEvents: "none",
          background: "rgba(0,0,0,0.85)",
          border: `1px solid ${ready ? "#10b981" : "#22d3ee"}`,
          borderRadius: 8,
          padding: "5px 11px",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 11,
          color: ready ? "#10b981" : "#22d3ee",
          whiteSpace: "nowrap",
          textShadow: `0 0 8px ${ready ? "#10b98155" : "#22d3ee55"}`,
          fontWeight: 600,
        }}
      >
        🌱 GREENHOUSE {ready ? "· HARVEST READY" : ""}
        <div style={{ color: "#fbbf24", fontSize: 9, marginTop: 2, letterSpacing: 1 }}>
          ▼ CLICK TO INSPECT
        </div>
      </Html>
    </group>
  );
}
