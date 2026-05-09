import { useEffect, useMemo } from "react";
import * as THREE from "three";

const SIZE = 30;
const SEG = 60;

export default function MarsTerrain() {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const r = Math.hypot(x, y);
      const noise =
        Math.sin(x * 0.4) * 0.06 +
        Math.cos(y * 0.55) * 0.05 +
        Math.sin(x * 1.7 + y * 1.3) * 0.04;
      const radial = Math.max(0, (r - 8) * 0.06);
      pos.setZ(i, noise - radial);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.3, 0]}
      receiveShadow
    >
      <meshStandardMaterial color="#a64422" roughness={0.97} metalness={0.02} />
    </mesh>
  );
}
