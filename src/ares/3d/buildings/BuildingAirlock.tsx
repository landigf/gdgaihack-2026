import { useEffect, useState } from "react";

type Props = {
  position: [number, number, number];
  onClick?: () => void;
};

export default function BuildingAirlock({ position, onClick }: Props) {
  const [hover, setHover] = useState(false);
  const accent = hover ? "#fbbf24" : "#facc15";

  useEffect(() => () => {
    document.body.style.cursor = "default";
  }, []);

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
        <boxGeometry args={[1.4, 0.1, 1.0]} />
        <meshStandardMaterial color="#3b3b40" roughness={0.8} />
      </mesh>

      {/* Small cylindrical chamber */}
      <mesh position={[0, 0.55, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 1.0, 16]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Hatch (yellow stripe ring) */}
      <mesh position={[0.5, 0.55, 0]}>
        <torusGeometry args={[0.42, 0.05, 6, 16]} />
        <meshStandardMaterial color="#1f2937" emissive={accent} emissiveIntensity={0.5} />
      </mesh>

      {/* Caution warning lamp */}
      <mesh position={[0, 1.0, 0]}>
        <sphereGeometry args={[0.08, 12, 8]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}
