import { config } from "../config";
import type {
  OverviewData, LeadsData, BdData, KamData, QualityData, PaymentData, Visibility, TabKey,
} from "../types";

export interface AllData {
  overview: OverviewData;
  leads: LeadsData;
  bd: BdData;
  kam: KamData;
  quality: QualityData;
  payment: PaymentData;
  meta: { generated_at: string; source: string };
  visibility: Visibility;
}

const DEFAULT_VISIBILITY: Visibility = {
  tabs: { overview: true, leads: true, bd: true, kam: true, quality: true, payment: true },
  kpiStrips: { overview: true, leads: true, bd: true, kam: true, quality: true, payment: true },
};

async function getJson<T>(name: string, fallback: T | null = null): Promise<T> {
  const res = await fetch(`${config.dataBase}/${name}.json`, { cache: "no-store" });
  if (!res.ok) {
    if (fallback !== null) return fallback;
    throw new Error(`Failed to load ${name}.json (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function loadAll(): Promise<AllData> {
  const [overview, leads, bd, kam, quality, payment, meta, visibility] = await Promise.all([
    getJson<OverviewData>("overview"),
    getJson<LeadsData>("leads"),
    getJson<BdData>("bd"),
    getJson<KamData>("kam"),
    getJson<QualityData>("quality"),
    getJson<PaymentData>("payment"),
    getJson<{ generated_at: string; source: string }>("meta", { generated_at: "", source: "" }),
    getJson<Visibility>("visibility", DEFAULT_VISIBILITY),
  ]);
  // merge in case visibility.json is partial
  const vis: Visibility = {
    tabs: { ...DEFAULT_VISIBILITY.tabs, ...(visibility?.tabs || {}) },
    kpiStrips: { ...DEFAULT_VISIBILITY.kpiStrips, ...(visibility?.kpiStrips || {}) },
  };
  return { overview, leads, bd, kam, quality, payment, meta, visibility: vis };
}

export { DEFAULT_VISIBILITY };
export type { TabKey };
