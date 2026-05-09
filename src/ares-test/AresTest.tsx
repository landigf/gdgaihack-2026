import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import { useRef } from "react";
import type { Mesh } from "three";

function SpinningCube() {
  const ref = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += dt * 0.6;
    ref.current.rotation.y += dt * 0.9;
  });
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={[1.4, 1.4, 1.4]} />
      <meshStandardMaterial color="#22d3ee" metalness={0.2} roughness={0.4} />
    </mesh>
  );
}

function MarsGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]} receiveShadow>
      <circleGeometry args={[6, 64]} />
      <meshStandardMaterial color="#a64422" roughness={0.95} />
    </mesh>
  );
}

export default function AresTest() {
  return (
    <div className="w-screen h-screen relative" style={{ background: "#0a0a0a" }}>
      <div
        className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-md font-mono text-xs"
        style={{
          background: "rgba(0,0,0,0.55)",
          color: "#22d3ee",
          border: "1px solid #22d3ee44",
        }}
      >
        ARES WebGL spike · R3F + drei · target ≥45 FPS
      </div>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [4, 4, 4], fov: 35 }}
      >
        <color attach="background" args={["#0e0a0c"]} />
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[5, 8, 4]}
          intensity={1.6}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <SpinningCube />
        <MarsGround />
        <OrbitControls makeDefault enablePan={false} />
        <Stats />
      </Canvas>
    </div>
  );
}
