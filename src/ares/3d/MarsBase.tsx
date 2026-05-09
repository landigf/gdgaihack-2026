import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import MarsTerrain from "./MarsTerrain";
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

      {/* Sun-like main light */}
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
      {/* Mars rim light */}
      <directionalLight position={[-8, 4, -6]} intensity={0.4} color="#c2410c" />
      <ambientLight intensity={0.25} color="#7c2d12" />

      <MarsTerrain />

      {/* Habitat (center) */}
      <BuildingHabitat
        position={[0, 0, 0]}
        alert={habitatAlert}
        onClick={() => onSelectBuilding?.("habitat")}
      />

      {/* Greenhouse — east */}
      <BuildingGreenhouse
        position={[5, 0, 1]}
        ready={greenhouseReady}
        onClick={() => onSelectBuilding?.("greenhouse")}
      />

      {/* ECLSS — south-east */}
      <BuildingECLSS
        position={[3, 0, 4.5]}
        onClick={() => onSelectBuilding?.("eclss")}
      />

      {/* ISRU — north-east, large */}
      <BuildingISRU
        position={[-1, 0, -5]}
        ch4FillPct={ch4FillPct}
        onClick={() => onSelectBuilding?.("isru")}
      />

      {/* Power — north */}
      <BuildingPower
        position={[-6.5, 0, -3]}
        onClick={() => onSelectBuilding?.("power")}
      />

      {/* Airlock — south */}
      <BuildingAirlock
        position={[-1.5, 0, 3.5]}
        onClick={() => onSelectBuilding?.("airlock")}
      />

      {/* Rover Garage — west */}
      <BuildingRoverGarage
        position={[-6, 0, 2]}
        onClick={() => onSelectBuilding?.("rover-garage")}
      />

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
