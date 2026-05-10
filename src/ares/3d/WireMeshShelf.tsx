import { useEffect, useMemo } from "react";
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

  useEffect(() => () => geom.dispose(), [geom]);

  return (
    <group position={position}>
      {/* Outer thin frame for definition */}
      <mesh position={[0, 0, -depth / 2]}>
        <boxGeometry args={[width + 0.08, 0.035, 0.045]} />
        <meshStandardMaterial color="#111827" metalness={0.72} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0, depth / 2]}>
        <boxGeometry args={[width + 0.08, 0.035, 0.045]} />
        <meshStandardMaterial color="#111827" metalness={0.72} roughness={0.32} />
      </mesh>
      <mesh position={[-width / 2, 0, 0]}>
        <boxGeometry args={[0.045, 0.035, depth + 0.08]} />
        <meshStandardMaterial color="#111827" metalness={0.72} roughness={0.32} />
      </mesh>
      <mesh position={[width / 2, 0, 0]}>
        <boxGeometry args={[0.045, 0.035, depth + 0.08]} />
        <meshStandardMaterial color="#111827" metalness={0.72} roughness={0.32} />
      </mesh>
      {/* Wire grid */}
      <lineSegments geometry={geom} position={[0, 0.008, 0]}>
        <lineBasicMaterial color={color} transparent opacity={0.95} />
      </lineSegments>
    </group>
  );
}
