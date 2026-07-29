export interface NameValue { name: string; value: number; [k: string]: any }

export interface OverviewData {
  kpis: Record<string, number>;
  funnel: { stage: string; value: number }[];
  calls_by_day: { date: string; calls: number }[];
  revenue_by_re: NameValue[];
  leads_by_group: NameValue[];
}
export interface LeadsData {
  kpis: Record<string, number>;
  by_type: NameValue[];
  by_group: NameValue[];
}
export interface BdData {
  kpis: Record<string, number>;
  by_bd: { name: string; calls: number; connected: number }[];
  connectivity: NameValue[];
  disposition: NameValue[];
  interest: NameValue[];
  d2c: NameValue[];
  funnel_stage: NameValue[];
  mode: NameValue[];
  lead_type: NameValue[];
  agreed_fk: NameValue[];
  by_day: { date: string; calls: number }[];
}
export interface KamData {
  kpis: Record<string, number>;
  by_kam: NameValue[];
  health: NameValue[];
  call_type: NameValue[];
  connectivity: NameValue[];
  mode: NameValue[];
  by_day: { date: string; calls: number }[];
}
export interface QualityData {
  kpis: Record<string, number>;
  by_bd: NameValue[];
  sop_dimensions: NameValue[];
  score_distribution: NameValue[];
  by_week: NameValue[];
}
export interface PaymentData {
  kpis: Record<string, number>;
  revenue_by_re: NameValue[];
  sellers_by_re: NameValue[];
  by_month: NameValue[];
  by_program: NameValue[];
  by_paytype: NameValue[];
  revenue_by_day: { date: string; revenue: number }[];
}

export type TabKey = "overview" | "leads" | "bd" | "kam" | "quality" | "payment";

export interface Visibility {
  tabs: Record<TabKey, boolean>;
  kpiStrips: Record<TabKey, boolean>;
}
