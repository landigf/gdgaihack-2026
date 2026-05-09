import { useEffect, useState } from "react";
import {
  formatRoundTrip,
  lightTimeOneWaySeconds,
  marsEarthDistanceAU,
} from "../lib/marsDistance";

export default function MarsLatencyChip() {
  const [distAU, setDistAU] = useState(() => marsEarthDistanceAU());

  useEffect(() => {
    const t = setInterval(() => setDistAU(marsEarthDistanceAU()), 1000);
    return () => clearInterval(t);
  }, []);

  const oneWayMin = lightTimeOneWaySeconds(distAU) / 60;
  const round = formatRoundTrip(distAU);

  return (
    <div
      title={`Mars-Earth distance ${distAU.toFixed(2)} AU · one-way light time ${oneWayMin.toFixed(1)} min`}
      className="px-3 py-1.5 rounded-md font-mono text-xs flex items-center gap-2"
      style={{
        background: "rgba(34,211,238,0.10)",
        border: "1px solid rgba(34,211,238,0.45)",
        color: "#a5f3fc",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: 9, color: "#67e8f9", letterSpacing: 1 }}>
        EARTH ROUND-TRIP
      </span>
      <span style={{ color: "#fafafa", fontWeight: 600 }}>{round}</span>
      <span style={{ fontSize: 9, color: "#94a3b8" }}>
        · {distAU.toFixed(2)} AU
      </span>
    </div>
  );
}
