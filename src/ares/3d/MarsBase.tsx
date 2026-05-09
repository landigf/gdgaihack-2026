import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import MarsTerrain from "./MarsTerrain";
import GLBBuilding from "./GLBBuilding";
import { BUILDING_URL } from "./buildingUrls";

import BuildingHabitat from "./buildings/BuildingHabitat";
import BuildingGreenhouse from "./buildings/BuildingGreenhouse";
import BuildingECLSS from "./buildings/BuildingECLSS";
import BuildingISRU from "./buildings/BuildingISRU";
import BuildingPower from "./buildings/BuildingPower";
import BuildingAirlock from "./buildings/BuildingAirlock";
import BuildingRoverGarage from "./buildings/BuildingRoverGarage";

type Props = {
  habitatAlert?: boolean;
  greenhouseReady?: boolean;
  ch4FillPct?: number;
  onSelectBuilding?: (id: BuildingId) => void;
  showStats?: boolean;
  useGLB?: boolean; // when false, fall back to procedural — useful if GLB load fails
  hideHints?: boolean; // when a modal is open above, don't render floating Html hints
};

export type BuildingId =
  | "habitat"
  | "greenhouse"
  | "eclss"
  | "isru"
  | "power"
  | "airlock"
  | "rover-garage";

export default function MarsBase({
  habitatAlert,
  greenhouseReady,
  ch4FillPct = 0.45,
  onSelectBuilding,
  showStats = false,
  useGLB = true,
  hideHints = false,
}: Props) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [12, 10, 12], fov: 30 }}
    >
      <color attach="background" args={["#10070a"]} />
      <fog attach="fog" args={["#1a0d0e", 18, 38]} />

      <directionalLight
        position={[8, 14, 6]}
        intensity={1.7}
        color="#ffe2c0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <directionalLight position={[-8, 4, -6]} intensity={0.4} color="#c2410c" />
      <ambientLight intensity={0.25} color="#7c2d12" />

      <MarsTerrain />

      {useGLB ? (
        <Suspense fallback={<ProceduralBase
          habitatAlert={habitatAlert}
          greenhouseReady={greenhouseReady}
          ch4FillPct={ch4FillPct}
          onSelectBuilding={onSelectBuilding}
        />}>
          <GLBBuilding
            url={BUILDING_URL.habitat}
            position={[0, 0, 0]}
            scale={1.0}
            alert={habitatAlert}
            alertRingRadius={1.4}
            onClick={() => onSelectBuilding?.("habitat")}
          />
          <GLBBuilding
            url={BUILDING_URL.greenhouse}
            position={[5, 0, 1]}
            scale={1.0}
            yScale={1.65}
            alert={greenhouseReady}
            alertColor="#10b981"
            alertRingRadius={1.5}
            emissiveAccent="#10b981"
            onClick={() => onSelectBuilding?.("greenhouse")}
          />
          <GLBBuilding
            url={BUILDING_URL.eclss}
            position={[3, 0, 4.5]}
            scale={1.0}
            alertRingRadius={1.4}
            onClick={() => onSelectBuilding?.("eclss")}
          />
          <GLBBuilding
            url={BUILDING_URL.isru}
            position={[-1, 0, -5]}
            scale={1.0}
            alertRingRadius={1.6}
            emissiveAccent="#fb923c"
            onClick={() => onSelectBuilding?.("isru")}
          />
          <GLBBuilding
            url={BUILDING_URL.power}
            position={[-6.5, 0, -3]}
            scale={1.0}
            alertRingRadius={2.0}
            emissiveAccent="#a78bfa"
            onClick={() => onSelectBuilding?.("power")}
          />
          <GLBBuilding
            url={BUILDING_URL.airlock}
            position={[-1.5, 0, 3.5]}
            scale={1.0}
            alertRingRadius={0.9}
            emissiveAccent="#facc15"
            onClick={() => onSelectBuilding?.("airlock")}
          />
          <GLBBuilding
            url={BUILDING_URL.rover_garage}
            position={[-6, 0, 2]}
            scale={1.0}
            alertRingRadius={1.4}
            onClick={() => onSelectBuilding?.("rover-garage")}
          />

          {/* Persistent click hint above the greenhouse since it's the WOW target */}
          {!hideHints && <GreenhouseClickHint position={[5, 2.6, 1]} ready={greenhouseReady} />}
        </Suspense>
      ) : (
        <ProceduralBase
          habitatAlert={habitatAlert}
          greenhouseReady={greenhouseReady}
          ch4FillPct={ch4FillPct}
          onSelectBuilding={onSelectBuilding}
        />
      )}

      <OrbitControls
        makeDefault
        enablePan={true}
        minDistance={6}
        maxDistance={28}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0.5, 0]}
      />
      {import.meta.env.DEV && showStats && <Stats />}
    </Canvas>
  );
}

import { Html } from "@react-three/drei";

function GreenhouseClickHint({
  position,
  ready,
}: {
  position: [number, number, number];
  ready?: boolean;
}) {
  return (
    <Html
      position={position}
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
  );
}

// ---------------------------------------------------------------------------
// Fallback: original procedural buildings (used if GLB Suspense times out
// or useGLB={false} is forced)
// ---------------------------------------------------------------------------
function ProceduralBase({
  habitatAlert,
  greenhouseReady,
  ch4FillPct = 0.45,
  onSelectBuilding,
}: Pick<Props, "habitatAlert" | "greenhouseReady" | "ch4FillPct" | "onSelectBuilding">) {
  return (
    <>
      <BuildingHabitat
        position={[0, 0, 0]}
        alert={habitatAlert}
        onClick={() => onSelectBuilding?.("habitat")}
      />
      <BuildingGreenhouse
        position={[5, 0, 1]}
        ready={greenhouseReady}
        onClick={() => onSelectBuilding?.("greenhouse")}
      />
      <BuildingECLSS
        position={[3, 0, 4.5]}
        onClick={() => onSelectBuilding?.("eclss")}
      />
      <BuildingISRU
        position={[-1, 0, -5]}
        ch4FillPct={ch4FillPct}
        onClick={() => onSelectBuilding?.("isru")}
      />
      <BuildingPower
        position={[-6.5, 0, -3]}
        onClick={() => onSelectBuilding?.("power")}
      />
      <BuildingAirlock
        position={[-1.5, 0, 3.5]}
        onClick={() => onSelectBuilding?.("airlock")}
      />
      <BuildingRoverGarage
        position={[-6, 0, 2]}
        onClick={() => onSelectBuilding?.("rover-garage")}
      />
    </>
  );
}
