import { useMemo } from "react";
import * as THREE from "three";

type Props = {
  width: number;
  depth: number;
  position?: [number, number, number];
  meshSize?: number; // grid spacing
  color?: string;
};

/**
 * WireMeshShelf — a single black wire-mesh shelf surface using LineSegments.
 * Visually transparent like a real plant rack — you can see through to the
 * shelves below.
 */
export default function WireMeshShelf({
  width,
  depth,
  position = [0, 0, 0],
  meshSize = 0.07,
  color = "#0a0a0a",
}: Props) {
  const geom = useMemo(() => {
    const segments: number[] = [];
    const halfW = width / 2;
    const halfD = depth / 2;
    // Lines parallel to X (running across width at each depth step)
    for (let z = -halfD; z <= halfD + 0.0001; z += meshSize) {
      segments.push(-halfW, 0, z, halfW, 0, z);
    }
    // Lines parallel to Z (running across depth at each width step)
    for (let x = -halfW; x <= halfW + 0.0001; x += meshSize) {
      segments.push(x, 0, -halfD, x, 0, halfD);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(segments, 3));
    return g;
  }, [width, depth, meshSize]);

  return (
    <group position={position}>
      {/* Outer thin frame for definition */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width + 0.04, 0.012, depth + 0.04]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Wire grid */}
      <lineSegments geometry={geom} position={[0, 0.008, 0]}>
        <lineBasicMaterial color={color} transparent opacity={0.95} />
      </lineSegments>
    </group>
  );
}
