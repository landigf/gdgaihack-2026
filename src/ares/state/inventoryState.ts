// Houston habitat inventory simulator — deterministic-with-noise ticking.
// Used by InventoryDetail (M6) to feed Houston the current envelope when
// rendering the Habitat / ECLSS drill-in.

import { useEffect, useState } from "react";

export type CrewMember = {
  name: string;
  role: string;
  status: string;
};

export type InventoryState = {
  food_sols_remaining: number;
  water_liters: number;
  water_recycle_pct: number;
  o2_kg_per_hr: number;
  o2_backup_hours: number;
  fuel_ch4_pct: number;
  medical_courses: number;
  spare_filters: number;
  crew: CrewMember[];
};

export type HabitatSensorState = {
  cabin_co2_ppm: number;
  cabin_pressure_kpa: number;
  radiation_uSv_per_hr: number;
  cabin_temp_c: number;
};

const INITIAL_INVENTORY: InventoryState = {
  food_sols_remaining: 47, // out of 90-sol mission resupply window
  water_liters: 1240,
  water_recycle_pct: 96,
  o2_kg_per_hr: 2.1, // ISRU rate
  o2_backup_hours: 12, // tank reserve if ISRU fails
  fuel_ch4_pct: 18, // return ascent vehicle CH4 tank
  medical_courses: 14, // antibiotic / EVA O2 unit count
  spare_filters: 6, // ECLSS replacement cartridges
  crew: [
    { name: "Cmdr Garcia", role: "Commander", status: "NOMINAL" },
    { name: "Lt Tanaka", role: "Pilot", status: "FATIGUE 4/10" },
    { name: "Dr Okafor", role: "Surgeon", status: "NOMINAL" },
    { name: "Sgt Hassan", role: "Engineer", status: "SLEEP DEBT 6 H" },
  ],
};

const INITIAL_SENSORS: HabitatSensorState = {
  cabin_co2_ppm: 812,
  cabin_pressure_kpa: 101.2,
  radiation_uSv_per_hr: 0.42,
  cabin_temp_c: 22.1,
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function useInventoryState() {
  const [inventory, setInventory] = useState<InventoryState>(INITIAL_INVENTORY);
  const [sensors, setSensors] = useState<HabitatSensorState>(INITIAL_SENSORS);

  useEffect(() => {
    const tick = setInterval(() => {
      setInventory((prev) => ({
        ...prev,
        // food sols slowly decreases — 1 demo-second = ~5 hours mission time
        food_sols_remaining: Math.max(
          0,
          prev.food_sols_remaining - (Math.random() < 0.05 ? 1 : 0)
        ),
        // water_liters drifts slightly (recycle losses + condensate)
        water_liters: clamp(prev.water_liters + (Math.random() - 0.5) * 0.6, 800, 1400),
        water_recycle_pct: clamp(
          prev.water_recycle_pct + (Math.random() - 0.5) * 0.2,
          92,
          97
        ),
        // ISRU O2 rate fluctuates with solar input
        o2_kg_per_hr: clamp(prev.o2_kg_per_hr + (Math.random() - 0.5) * 0.05, 1.6, 2.4),
        // backup tank slowly fills when ISRU > demand
        o2_backup_hours: clamp(
          prev.o2_backup_hours + (Math.random() - 0.45) * 0.05,
          0,
          24
        ),
      }));
      setSensors((prev) => ({
        ...prev,
        cabin_co2_ppm: clamp(prev.cabin_co2_ppm + (Math.random() - 0.5) * 8, 600, 1500),
        cabin_pressure_kpa: clamp(
          prev.cabin_pressure_kpa + (Math.random() - 0.5) * 0.05,
          100.8,
          101.6
        ),
        radiation_uSv_per_hr: clamp(
          prev.radiation_uSv_per_hr + (Math.random() - 0.5) * 0.02,
          0.2,
          0.9
        ),
        cabin_temp_c: clamp(prev.cabin_temp_c + (Math.random() - 0.5) * 0.1, 20.5, 23.5),
      }));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  return { inventory, sensors };
}
