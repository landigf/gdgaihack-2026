import { Suspense, useEffect, useMemo, useState } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import AlertRing from "./AlertRing";

type Props = {
  url: string;
  position: [number, number, number];
  scale?: number;
  yScale?: number; // greenhouse needs Y-stretch (PR #4 dome max H=1.32)
  rotationY?: number;
  alert?: boolean;
  alertColor?: string;
  alertRingRadius?: number;
  emissiveAccent?: string; // overrides emissive on hover
  onClick?: () => void;
  onHoverChange?: (hover: boolean) => void;
};

/**
 * Loads a GLB and attaches an alert ring at the ALERT_RING_ANCHOR empty
 * (a top-center named node placed in the GLB by the asset pipeline).
 *
 * Suspense fallback: nothing rendered while the .glb fetches. The caller
 * decides whether to wrap in <Suspense fallback={<ProceduralBuilding />}>
 * for a graceful procedural fallback path.
 */
function GLBBuildingInner({
  url,
  position,
  scale = 1,
  yScale = 1,
  rotationY = 0,
  alert,
  alertColor = "#ef4444",
  alertRingRadius = 1.4,
  emissiveAccent,
  onClick,
  onHoverChange,
}: Props) {
  const { scene } = useGLTF(url);
  const [hover, setHover] = useState(false);

  // Clone once per URL change so multiple instances of the same GLB render independently
  const cloned = useMemo(() => scene.clone(true), [scene]);

  // Find anchor + apply optional emissive accent on hover
  const anchorPos = useMemo(() => {
    const anchor = cloned.getObjectByName("ALERT_RING_ANCHOR");
    if (!anchor) return new THREE.Vector3(0, 1, 0);
    return anchor.getWorldPosition(new THREE.Vector3());
  }, [cloned]);

  // Apply hover emissive on every MeshStandardMaterial in the clone
  useEffect(() => {
    cloned.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const mat = obj.material;
        if (mat instanceof THREE.MeshStandardMaterial) {
          if (hover && emissiveAccent) {
            mat.emissive = new THREE.Color(emissiveAccent);
            mat.emissiveIntensity = 0.25;
          } else if (alert) {
            mat.emissive = new THREE.Color(alertColor);
            mat.emissiveIntensity = 0.18;
          } else {
            // restore (we don't know original; just dim)
            mat.emissiveIntensity = 0.0;
          }
        }
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [cloned, hover, emissiveAccent, alert, alertColor]);

  // Cleanup cursor on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = "default";
    };
  }, []);

  return (
    <group
      position={position}
      scale={[scale, scale * yScale, scale]}
      rotation={[0, rotationY, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        onHoverChange?.(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        onHoverChange?.(false);
        document.body.style.cursor = "default";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <primitive object={cloned} />
      {alert && (
        <AlertRing radius={alertRingRadius} color={alertColor} />
      )}
      {hover && !alert && (
        <AlertRing radius={alertRingRadius * 0.9} color="#22d3ee" active />
      )}
      {/* anchor reference kept for future drei <Html> labels */}
      <group position={anchorPos.toArray()} />
    </group>
  );
}

export default function GLBBuilding(props: Props) {
  return (
    <Suspense fallback={null}>
      <GLBBuildingInner {...props} />
    </Suspense>
  );
}

