import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area,
} from "recharts";
import type { NameValue } from "../types";
import { SERIES, fmt } from "./ui";

const AXIS = "#898781";
const GRID = "#e7e8ea";

function TipBox({ active, payload, label, valueLabel }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rc-tip">
      <div className="t">{label ?? payload[0].name}</div>
      {payload.map((p: any, i: number) => (
        <div className="v" key={i}>
          {p.name && p.name !== label ? `${p.name}: ` : ""}
          {valueLabel ? valueLabel(p.value) : fmt(p.value)}
        </div>
      ))}
    </div>
  );
}

export function Donut({ data, valueLabel }: { data: NameValue[]; valueLabel?: (n: number) => string }) {
  if (!data || data.length === 0) return <div className="empty">No data yet</div>;
  return (
    <ResponsiveContainer width="100%" height={230}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%"
          innerRadius={52} outerRadius={82} paddingAngle={2} stroke="#fff" strokeWidth={2}>
          {data.map((_, i) => <Cell key={i} fill={SERIES[i % SERIES.length]} />)}
        </Pie>
        <Tooltip content={<TipBox valueLabel={valueLabel} />} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Vertical bars — one series, colored per category
export function VBars({ data, color, valueLabel, height = 250 }: {
  data: NameValue[]; color?: string; valueLabel?: (n: number) => string; height?: number;
}) {
  if (!data || data.length === 0) return <div className="empty">No data yet</div>;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -6, bottom: 4 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={{ stroke: "#c3c2b7" }}
          interval={0} angle={data.length > 5 ? -15 : 0} textAnchor={data.length > 5 ? "end" : "middle"} height={data.length > 5 ? 54 : 24} />
        <YAxis tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={44} />
        <Tooltip cursor={{ fill: "rgba(40,116,240,0.06)" }} content={<TipBox valueLabel={valueLabel} />} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={54}>
          {data.map((_, i) => <Cell key={i} fill={color || SERIES[i % SERIES.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Grouped bars: calls vs connected per agent
export function GroupedBars({ data, height = 280 }: {
  data: { name: string; calls: number; connected: number }[]; height?: number;
}) {
  if (!data || data.length === 0) return <div className="empty">No data yet</div>;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -6, bottom: 30 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={{ stroke: "#c3c2b7" }}
          interval={0} angle={-18} textAnchor="end" height={64} />
        <YAxis tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={44} />
        <Tooltip cursor={{ fill: "rgba(40,116,240,0.06)" }} content={<TipBox />} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="calls" name="Calls" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={30} />
        <Bar dataKey="connected" name="Connected" fill={SERIES[2]} radius={[4, 4, 0, 0]} maxBarSize={30} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Trend({ data, xKey, yKey, color = SERIES[0], valueLabel, height = 240, label }: {
  data: any[]; xKey: string; yKey: string; color?: string;
  valueLabel?: (n: number) => string; height?: number; label?: string;
}) {
  if (!data || data.length === 0) return <div className="empty">No data yet</div>;
  const id = `grad-${yKey}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 10, left: -6, bottom: 4 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 10.5, fill: AXIS }} tickLine={false} axisLine={{ stroke: "#c3c2b7" }}
          tickFormatter={(v) => String(v).slice(5)} minTickGap={20} />
        <YAxis tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={44} />
        <Tooltip content={<TipBox valueLabel={valueLabel} />} />
        <Area type="monotone" dataKey={yKey} name={label || yKey} stroke={color} strokeWidth={2}
          fill={`url(#${id})`} dot={{ r: 2, fill: color }} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Horizontal % bars for SOP pass rates (status-colored by threshold)
export function PctBars({ data }: { data: NameValue[] }) {
  if (!data || data.length === 0) return <div className="empty">No data yet</div>;
  const color = (v: number) => (v >= 75 ? "#0ca30c" : v >= 50 ? "#fab219" : "#d03b3b");
  return (
    <div className="barlist">
      {data.map((d, i) => (
        <div className="item" key={d.name + i}>
          <div className="nm" title={d.name}>{d.name}</div>
          <div className="track">
            <div className="fill" style={{ width: `${d.value}%`, background: color(d.value) }} />
          </div>
          <div className="vl">{d.value}%</div>
        </div>
      ))}
    </div>
  );
}
