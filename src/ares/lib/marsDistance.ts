// Mars-Earth distance / light-time approximation.
// Synodic period ≈ 779.94 Earth days (≈ 26 months).
// Distance ranges 0.38 AU (opposition) to 2.67 AU (conjunction).
// One-way light time = distance(km) / c(km/s).

const SYNODIC_DAYS = 779.94;
const AU_KM = 149_597_870.7;
const C_KM_PER_S = 299_792.458;
const MIN_DIST_AU = 0.38;
const MAX_DIST_AU = 2.67;

// Pick a deterministic phase so the demo always opens in a high-latency
// window (otherwise the chip reads "4 minutes" and the pitch loses punch).
// Phase 0.55 ≈ 14 minutes one-way → 28 round-trip — exactly the iconic value.
const DEMO_PHASE_OFFSET = 0.55;

export function marsEarthDistanceAU(realtimeSeconds = Date.now() / 1000): number {
  // Slow drift over the demo (~ tens of seconds) so the value moves visibly
  // without ever leaving the believable envelope.
  const phase =
    DEMO_PHASE_OFFSET +
    (realtimeSeconds / 86400 / SYNODIC_DAYS) +
    Math.sin(realtimeSeconds / 30) * 0.001; // tiny wobble, ~minute timescale
  // Cosine of phase * 2π gives a believable distance curve
  const cosPhase = Math.cos(phase * 2 * Math.PI);
  // Map cosPhase ∈ [-1,1] → distance ∈ [MIN, MAX]
  return MIN_DIST_AU + ((1 - cosPhase) / 2) * (MAX_DIST_AU - MIN_DIST_AU);
}

export function lightTimeOneWaySeconds(distAU: number): number {
  return (distAU * AU_KM) / C_KM_PER_S;
}

export function formatRoundTrip(distAU: number): string {
  const oneWay = lightTimeOneWaySeconds(distAU);
  const round = oneWay * 2;
  const m = Math.floor(round / 60);
  const s = Math.floor(round % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
