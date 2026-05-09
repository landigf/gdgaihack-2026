import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  radius: number;
  color?: string;
  active?: boolean;
};

export default function AlertRing({ radius, color = "#22d3ee", active = true }: Props) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    if (!ref.current || !matRef.current) return;
    const t = state.clock.elapsedTime;
    const pulse = (Math.sin(t * 2) + 1) / 2;
    const scale = 1 + pulse * 0.25;
    ref.current.scale.set(scale, scale, scale);
    matRef.current.opacity = active ? 0.35 + pulse * 0.4 : 0.1;
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
      <ringGeometry args={[radius * 0.95, radius * 1.15, 32]} />
      <meshBasicMaterial
        ref={matRef}
        color={color}
        transparent
        opacity={0.5}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
