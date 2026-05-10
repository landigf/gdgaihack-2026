import { useEffect, useMemo } from "react";
import * as THREE from "three";

const SIZE = 30;
const SEG = 60;

const CRATERS = [
  { x: -7.2, y: 5.1, r: 2.2, d: 0.18 },
  { x: 6.4, y: -5.7, r: 1.55, d: 0.14 },
  { x: 8.6, y: 4.7, r: 1.05, d: 0.1 },
  { x: -4.8, y: -7.8, r: 1.35, d: 0.12 },
];

const ROCKS = [
  [-9.2, 0.02, -2.6, 0.16, 0.4],
  [-7.8, 0.04, 3.5, 0.11, 1.1],
  [-3.8, 0.03, -8.9, 0.13, 0.7],
  [-2.2, 0.02, 6.7, 0.08, 2.2],
  [2.7, 0.03, -7.3, 0.12, 1.7],
  [4.1, 0.02, 5.9, 0.09, 0.2],
  [7.6, 0.04, -1.4, 0.14, 2.7],
  [9.3, 0.02, 3.7, 0.1, 1.4],
] as const;

export default function MarsTerrain() {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
    const pos = g.attributes.position;
    const colors: number[] = [];
    const low = new THREE.Color("#7c2d12");
    const mid = new THREE.Color("#a64422");
    const high = new THREE.Color("#c75a2d");
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const r = Math.hypot(x, y);
      const noise =
        Math.sin(x * 0.4) * 0.06 +
        Math.cos(y * 0.55) * 0.05 +
        Math.sin(x * 1.7 + y * 1.3) * 0.04 +
        Math.sin(x * 3.1 - y * 2.7) * 0.018;
      const radial = Math.max(0, (r - 8) * 0.06);
      const crater = CRATERS.reduce((acc, c) => {
        const dist = Math.hypot(x - c.x, y - c.y);
        if (dist > c.r) return acc;
        const bowl = Math.cos((dist / c.r) * Math.PI) * 0.5 + 0.5;
        const rim = Math.exp(-Math.pow((dist - c.r * 0.82) / (c.r * 0.12), 2)) * c.d * 0.85;
        return acc - bowl * c.d + rim;
      }, 0);
      const z = noise + crater - radial;
      pos.setZ(i, z);

      const tint = Math.max(0, Math.min(1, 0.45 + z * 1.8 + Math.sin(x * 0.9 + y) * 0.08));
      const color = mid.clone().lerp(tint > 0.5 ? high : low, Math.abs(tint - 0.5) * 1.3);
      colors.push(color.r, color.g, color.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group>
      <mesh
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.3, 0]}
        receiveShadow
      >
        <meshStandardMaterial vertexColors roughness={0.98} metalness={0.02} />
      </mesh>
      {ROCKS.map(([x, y, z, r, rot], i) => (
        <mesh
          key={i}
          position={[x, y - 0.27, z]}
          rotation={[0.3, rot, 0.1]}
          scale={[1.4, 0.72, 1.0]}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[r, 0]} />
          <meshStandardMaterial color={i % 2 ? "#8b3f1f" : "#6f2f16"} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
