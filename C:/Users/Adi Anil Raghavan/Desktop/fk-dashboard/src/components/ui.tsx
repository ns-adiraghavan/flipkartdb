import type { ReactNode } from "react";
import type { NameValue } from "../types";

export const SERIES = [
  "#2874f0", "#eb6834", "#1baf7a", "#eda100",
  "#e87ba4", "#008300", "#4a3aa7", "#e34948",
];

export const fmt = (n: number | undefined) =>
  n === undefined || n === null ? "—" : n.toLocaleString("en-IN");

export const fmtINR = (n: number | undefined) =>
  n === undefined || n === null ? "—" : "₹" + n.toLocaleString("en-IN");

export const fmtCompact = (n: number) => {
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(2) + " Cr";
  if (n >= 100000) return "₹" + (n / 100000).toFixed(2) + " L";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(1) + "K";
  return "₹" + n;
};

export function Kpi({ label, value, foot, accent }: {
  label: string; value: string | number; foot?: string; accent?: string;
}) {
  return (
    <div className="kpi" style={accent ? ({ ["--accent" as any]: accent }) : undefined}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {foot && <div className="foot">{foot}</div>}
    </div>
  );
}

export function KpiStrip({ children }: { children: ReactNode }) {
  return <div className="kpi-strip">{children}</div>;
}

export function Card({ title, sub, children, className = "" }: {
  title: string; sub?: string; children: ReactNode; className?: string;
}) {
  return (
    <div className={`card ${className}`}>
      <h3>{title}</h3>
      {sub && <div className="sub">{sub}</div>}
      {children}
    </div>
  );
}

// Horizontal bar list — best for small / categorical datasets (crisp, no axis noise)
export function BarList({ data, colorByIndex = false, color = SERIES[0], max, valueFmt }: {
  data: NameValue[]; colorByIndex?: boolean; color?: string; max?: number;
  valueFmt?: (n: number) => string;
}) {
  if (!data || data.length === 0) return <div className="empty">No data yet</div>;
  const top = max ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="barlist">
      {data.map((d, i) => (
        <div className="item" key={d.name + i}>
          <div className="nm" title={d.name}>{d.name}</div>
          <div className="track">
            <div className="fill" style={{
              width: `${(d.value / top) * 100}%`,
              background: colorByIndex ? SERIES[i % SERIES.length] : color,
            }} />
          </div>
          <div className="vl">{valueFmt ? valueFmt(d.value) : fmt(d.value)}</div>
        </div>
      ))}
    </div>
  );
}

// Conversion funnel — ordinal blue ramp, each stage vs previous + vs top
export function Funnel({ data }: { data: { stage: string; value: number }[] }) {
  if (!data || data.length === 0) return <div className="empty">No data</div>;
  const top = data[0].value || 1;
  const ramp = ["#2874f0", "#3d82f2", "#5a97f4", "#7aaef6", "#9cc4f8", "#0ca30c"];
  return (
    <div className="funnel">
      {data.map((d, i) => {
        const pctTop = (d.value / top) * 100;
        const prev = i === 0 ? d.value : data[i - 1].value;
        const step = i === 0 ? 100 : (d.value / (prev || 1)) * 100;
        return (
          <div className="row" key={d.stage}>
            <div className="name">{d.stage}</div>
            <div className="bar-wrap">
              <div className="bar" style={{ width: `${Math.max(pctTop, 3)}%`, background: ramp[i % ramp.length] }}>
                {fmt(d.value)}
              </div>
            </div>
            <div className="pct">
              <b>{pctTop.toFixed(pctTop < 1 ? 2 : 1)}%</b> of top
              {i > 0 && <> · {step.toFixed(step < 1 ? 2 : 0)}% step</>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
