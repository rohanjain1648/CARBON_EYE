export interface CarbonLifecycle {
  raw_materials: number;
  manufacturing: number;
  transport: number;
  use_phase: number;
  end_of_life: number;
}

export interface CarbonEquivalents {
  driving_km: number;
  trees_year: number;
  water_litres: number;
  flight_percent: number;
}

export interface CarbonAlternative {
  name: string;
  co2e_kg: number;
  reduction_percent: number;
  reason: string;
}

export type CarbonGrade = "A" | "B" | "C" | "D" | "F";
export type ConfidenceLevel = "high" | "medium" | "low";

export interface CarbonResult {
  product: string;
  category: string;
  total_co2e_kg: number;
  confidence: ConfidenceLevel;
  lifecycle: CarbonLifecycle;
  grade: CarbonGrade;
  category_average_co2e_kg: number;
  equivalents: CarbonEquivalents;
  key_insight: string;
  alternatives: CarbonAlternative[];
}

export interface SearchRecord {
  id: string;
  product_name: string;
  result: CarbonResult;
  search_count: number;
  created_at: string;
}
