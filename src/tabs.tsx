import { useState } from "react";
import type { ReactNode } from "react";
import type { AllData } from "./data/store";
import type { SourceReport } from "./types";
import { Kpi, KpiStrip, Card, BarList, Funnel, fmt, fmtINR, fmtCompact, SERIES } from "./components/ui";
import { Donut, VBars, GroupedBars, Trend, PctBars, StackedBars } from "./components/charts";

const pct = (a: number, b: number) => (b ? ((a / b) * 100).toFixed(1) + "%" : "—");

/* ── Overview ───────────────────────────────────────────────────────────────*/
export function Overview({ d, showKpi }: { d: AllData; showKpi: boolean }) {
  const o = d.overview;
  const k = o.kpis;
  return (
    <>
      {showKpi && (
        <KpiStrip>
          <Kpi label="Leads Sourced" value={fmt(k.total_leads)} accent={SERIES[0]} foot="top of funnel" />
          <Kpi label="Calls Made" value={fmt(k.total_calls)} accent={SERIES[1]} foot={`${k.agents} BD agents`} />
          <Kpi label="Connect Rate" value={k.connect_rate + "%"} accent={SERIES[2]} foot="of calls made" />
          <Kpi label="Sellers Onboarded" value={fmt(k.sellers_paid)} accent={SERIES[5]} foot="payment completed" />
          <Kpi label="Revenue (incl. GST)" value={fmtCompact(k.revenue_incl_gst)} accent={SERIES[3]} foot="JAS '26 quarter" />
          <Kpi label="Avg QA Score" value={k.avg_qa_score + "/100"} accent={SERIES[6]} foot="BD call quality" />
        </KpiStrip>
      )}
      <div className="grid c3">
        <Card title="Acquisition Funnel" sub="Leads → Calls → Connected → Interested → Agreed → Paid" className="span2 pad">
          <Funnel data={o.funnel} />
        </Card>
        <Card title="Leads by Source Family" sub={`${fmt(d.leads.kpis.distinct_sources)} source sets`}>
          <Donut data={o.leads_by_group} />
        </Card>
      </div>
      <div className="grid c3" style={{ marginTop: 16 }}>
        <Card title="BD Calls per Day" sub="July 2026 outreach volume" className="span2 pad">
          <Trend data={o.calls_by_day} xKey="date" yKey="calls" label="Calls" />
        </Card>
        <Card title="Revenue by Executive" sub="paid onboardings (incl. GST)">
          <BarList data={o.revenue_by_re} colorByIndex valueFmt={fmtCompact} />
        </Card>
      </div>
    </>
  );
}

/* ── Leads ──────────────────────────────────────────────────────────────────*/
// outcome-quality ramp (matches DISP_ORDER in the data build)
const DISP_COLOR: Record<string, string> = {
  "Payment Completed - Nextgen LITE": "#0a7d2c",
  "Interested Onboarding in Nextgen LITE": "#1baf7a",
  "Interested but Callback Later": "#16a3b8",
  "Call Back Requested": "#2874f0",
  "Call Picked & Disconnected": "#6b7a99",
  "Not Reachable / Switched Off / Out of Network": "#eda100",
  "RNR (Ring No Response)": "#b0b3ba",
  "Not Interested": "#e34948",
};
const DISP_SHORT: Record<string, string> = {
  "Payment Completed - Nextgen LITE": "Paid",
  "Interested Onboarding in Nextgen LITE": "Onboarding",
  "Interested but Callback Later": "Int. (callback)",
  "Call Back Requested": "Callback req.",
  "Call Picked & Disconnected": "Picked / disc.",
  "Not Reachable / Switched Off / Out of Network": "Not reachable",
  "RNR (Ring No Response)": "RNR",
  "Not Interested": "Not interested",
};

type PrimaryKey = "day" | "agent" | "lead_type_bin" | "disposition";
type ColorKey = "disposition" | "lead_type_bin" | "none";

const PRIMARIES: { key: PrimaryKey; label: string }[] = [
  { key: "day", label: "Day-wise" },
  { key: "agent", label: "Agent" },
  { key: "lead_type_bin", label: "Lead type" },
  { key: "disposition", label: "Disposition" },
];
// which colour dimensions are valid for each primary (day is a flat trend)
const COLORS_FOR: Record<PrimaryKey, ColorKey[]> = {
  day: ["none"],
  agent: ["disposition", "lead_type_bin", "none"],
  lead_type_bin: ["disposition", "none"],
  disposition: ["lead_type_bin", "none"],
};
const COLOR_LABEL: Record<ColorKey, string> = {
  disposition: "Disposition", lead_type_bin: "Lead type", none: "None",
};

function ltbColor(seg: string, series: string[]) {
  const i = series.indexOf(seg);
  return SERIES[(i < 0 ? 0 : i) % SERIES.length];
}

function CoverageView({ sr }: { sr: SourceReport }) {
  const [primary, setPrimary] = useState<PrimaryKey>("agent");
  const [color, setColor] = useState<ColorKey>("disposition");

  const allowed = COLORS_FOR[primary];
  const activeColor: ColorKey = allowed.includes(color) ? color : allowed[0];

  const setPrim = (p: PrimaryKey) => {
    setPrimary(p);
    if (!COLORS_FOR[p].includes(color)) setColor(COLORS_FOR[p][0]);
  };

  let body: ReactNode;
  let legend: { label: string; color: string }[] = [];

  if (primary === "day") {
    body = <Trend data={sr.flat.day} xKey="name" yKey="value" label="Unique brands" color={SERIES[0]} height={260} />;
  } else if (activeColor === "none") {
    body = <BarList data={sr.flat[primary]} colorByIndex />;
  } else {
    const block = sr.stacks[`${primary}|${activeColor}`];
    const colorFor = (seg: string) =>
      activeColor === "disposition" ? (DISP_COLOR[seg] || SERIES[0]) : ltbColor(seg, block.series);
    const label = (seg: string) =>
      activeColor === "disposition" ? (DISP_SHORT[seg] || seg) : seg;
    legend = block.series.map((s) => ({ label: label(s), color: colorFor(s) }));
    body = <StackedBars data={block.data} series={block.series} colorFor={(s) => colorFor(s)} height={220} />;
  }

  const foot =
    primary === "day"
      ? `Unique brands called per day · ${sr.meta.active_days} active days (${sr.meta.date_start} → ${sr.meta.date_end})`
      : `Each brand counted once, at its most recent call — segments sum to the row total. Grand total ${fmt(sr.meta.unique_brands)} unique brands.`;

  return (
    <Card title="Calling Coverage" sub={`${fmt(sr.meta.unique_brands)} unique brands across ${fmt(sr.meta.call_rows)} calls`} className="span2 pad">
      <div className="lsr-ctl">
        <div className="grp">
          <span>Summarise by</span>
          <div className="seg">
            {PRIMARIES.map((p) => (
              <button key={p.key} className={primary === p.key ? "on" : ""} onClick={() => setPrim(p.key)}>{p.label}</button>
            ))}
          </div>
        </div>
        <div className="grp">
          <span>Colour by</span>
          <div className="seg">
            {(["disposition", "lead_type_bin", "none"] as ColorKey[]).map((c) => (
              <button key={c} className={activeColor === c ? "on" : ""}
                disabled={!allowed.includes(c)} onClick={() => setColor(c)}>{COLOR_LABEL[c]}</button>
            ))}
          </div>
        </div>
      </div>
      {body}
      {legend.length > 0 && (
        <div className="legend">
          {legend.map((li) => (
            <span className="li" key={li.label}><span className="sw" style={{ background: li.color }} />{li.label}</span>
          ))}
        </div>
      )}
      <div className="note">{foot}</div>
    </Card>
  );
}

function SummaryMatrix({ sr }: { sr: SourceReport }) {
  const disps = sr.matrix.dispositions;
  return (
    <Card title="Lead Type Bin × Disposition" sub="unique brands per cell — reconciles to the source pivot" className="span2 pad">
      <div className="matrix-wrap">
        <table className="matrix">
          <thead>
            <tr>
              <th className="k">Lead type bin</th>
              {disps.map((dp) => <th key={dp} title={dp}>{DISP_SHORT[dp] || dp}</th>)}
              <th className="tot">Unique</th>
            </tr>
          </thead>
          <tbody>
            {sr.matrix.rows.map((row) => (
              <tr key={row.name}>
                <td className="k">{row.name}</td>
                {disps.map((dp) => {
                  const v = row.cells[dp] || 0;
                  return <td key={dp} className={v === 0 ? "z" : ""}>{v === 0 ? "—" : fmt(v)}</td>;
                })}
                <td className="tot">{fmt(row.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="note">
        A brand can reach more than one outcome across repeat calls, so it may appear in several columns —
        row "Unique" de-duplicates. Columns and rows therefore don't sum to a single grand total.
      </div>
    </Card>
  );
}

export function Leads({ d, showKpi }: { d: AllData; showKpi: boolean }) {
  const l = d.leads; const k = l.kpis;
  const sr = l.source_report;
  return (
    <>
      {showKpi && (
        <KpiStrip>
          <Kpi label="Total Leads Sourced" value={fmt(k.total_leads)} accent={SERIES[0]} />
          <Kpi label="Source Sets" value={fmt(k.distinct_sources)} accent={SERIES[6]} foot="lead-type buckets" />
          <Kpi label="NS Internal Leads" value={fmt(k.internal_leads)} accent={SERIES[1]} foot={pct(k.internal_leads, k.total_leads) + " of pool"} />
          <Kpi label="Existing on Flipkart" value={fmt(k.existing_on_fk)} accent={SERIES[2]} foot="have a Seller ID" />
        </KpiStrip>
      )}
      <div className="grid c2">
        <Card title="Lead Pool by Source Family" sub="grouped view">
          <Donut data={l.by_group} />
        </Card>
        <Card title="Lead Pool by Source Set" sub="raw lead-type buckets" className="pad">
          <BarList data={l.by_type} colorByIndex />
        </Card>
      </div>
      {sr && (
        <>
          <div className="section-rule">Lead Source Report — calling coverage &amp; outcomes</div>
          <div className="grid c2">
            <CoverageView sr={sr} />
          </div>
          <div className="grid c2" style={{ marginTop: 16 }}>
            <SummaryMatrix sr={sr} />
          </div>
        </>
      )}
    </>
  );
}

/* ── BD Calling ─────────────────────────────────────────────────────────────*/
export function BdCalling({ d, showKpi }: { d: AllData; showKpi: boolean }) {
  const b = d.bd; const k = b.kpis;
  return (
    <>
      {showKpi && (
        <KpiStrip>
          <Kpi label="Total Calls" value={fmt(k.total_calls)} accent={SERIES[0]} foot={`${k.agents} agents`} />
          <Kpi label="Connected" value={fmt(k.connected)} accent={SERIES[2]} foot={k.connect_rate + "% connect rate"} />
          <Kpi label="Interested (Warm+Hot)" value={fmt(k.interested)} accent={SERIES[1]} />
          <Kpi label="D2C Qualified" value={fmt(k.d2c_qualified)} accent={SERIES[6]} />
          <Kpi label="Callbacks Pending" value={fmt(k.callbacks)} accent={SERIES[3]} />
          <Kpi label="Agreed Onboarding" value={fmt(k.agreed_onboarding)} accent={SERIES[5]} />
        </KpiStrip>
      )}
      <div className="grid c3">
        <Card title="Calls vs Connected by Agent" className="span2 pad">
          <GroupedBars data={b.by_bd} />
        </Card>
        <Card title="Connectivity"><Donut data={b.connectivity} /></Card>
      </div>
      <div className="grid c3" style={{ marginTop: 16 }}>
        <Card title="Call Disposition" sub="top buckets" className="span2 pad">
          <BarList data={b.disposition} colorByIndex />
        </Card>
        <Card title="Interest Level"><Donut data={b.interest} /></Card>
      </div>
      <div className="grid c3" style={{ marginTop: 16 }}>
        <Card title="Calls per Day" className="span2 pad">
          <Trend data={b.by_day} xKey="date" yKey="calls" label="Calls" color={SERIES[0]} />
        </Card>
        <Card title="Mode of Calling"><Donut data={b.mode} /></Card>
      </div>
      <div className="grid c2" style={{ marginTop: 16 }}>
        <Card title="D2C Qualification" className="pad"><BarList data={b.d2c} colorByIndex /></Card>
        <Card title="Agreed on FK Onboarding" className="pad"><BarList data={b.agreed_fk} colorByIndex /></Card>
      </div>
    </>
  );
}

/* ── KAM Calling ────────────────────────────────────────────────────────────*/
export function KamCalling({ d, showKpi }: { d: AllData; showKpi: boolean }) {
  const m = d.kam; const k = m.kpis;
  return (
    <>
      {showKpi && (
        <KpiStrip>
          <Kpi label="KAM Calls" value={fmt(k.total_calls)} accent={SERIES[0]} foot={`${k.kams} KAMs`} />
          <Kpi label="Connected" value={fmt(k.connected)} accent={SERIES[2]} foot={k.connect_rate + "% connect rate"} />
          <Kpi label="Follow-ups Required" value={fmt(k.followups_required)} accent={SERIES[3]} />
          <Kpi label="Accounts At Risk" value={fmt(k.at_risk)} accent={SERIES[7]} foot="health status" />
        </KpiStrip>
      )}
      <div className="grid c3">
        <Card title="Account Health" sub="post-onboarding status"><Donut data={m.health} /></Card>
        <Card title="Call Type" className="span2 pad"><BarList data={m.call_type} colorByIndex /></Card>
      </div>
      <div className="grid c3" style={{ marginTop: 16 }}>
        <Card title="Calls by KAM" className="pad"><BarList data={m.by_kam} colorByIndex /></Card>
        <Card title="Connectivity"><Donut data={m.connectivity} /></Card>
        <Card title="Mode of Calling"><Donut data={m.mode} /></Card>
      </div>
    </>
  );
}

/* ── BD Quality ─────────────────────────────────────────────────────────────*/
export function Quality({ d, showKpi }: { d: AllData; showKpi: boolean }) {
  const q = d.quality; const k = q.kpis;
  return (
    <>
      {showKpi && (
        <KpiStrip>
          <Kpi label="Audits Completed" value={fmt(k.audits)} accent={SERIES[0]} foot={`${k.bds_audited} BDs`} />
          <Kpi label="Avg Score" value={k.avg_score + "/100"} accent={SERIES[6]} />
          <Kpi label="Pass Rate" value={k.pass_rate + "%"} accent={SERIES[2]} foot="score ≥ 60" />
          <Kpi label="Fatal Errors" value={fmt(k.fatal_errors)} accent={SERIES[7]} />
        </KpiStrip>
      )}
      <div className="grid c2">
        <Card title="Avg Score by BD" sub="out of 100" className="pad">
          <VBars data={q.by_bd} />
        </Card>
        <Card title="SOP Dimension Pass Rate" sub="% of audits scoring 'Yes' per stage" className="pad">
          <PctBars data={q.sop_dimensions} />
        </Card>
      </div>
      <div className="grid c2" style={{ marginTop: 16 }}>
        <Card title="Score Distribution" className="pad"><VBars data={q.score_distribution} color={SERIES[6]} height={220} /></Card>
        <Card title="Audits by Week" className="pad"><BarList data={q.by_week} colorByIndex /></Card>
      </div>
    </>
  );
}

/* ── Payment ────────────────────────────────────────────────────────────────*/
export function Payment({ d, showKpi }: { d: AllData; showKpi: boolean }) {
  const p = d.payment; const k = p.kpis;
  return (
    <>
      {showKpi && (
        <KpiStrip>
          <Kpi label="Sellers Onboarded" value={fmt(k.sellers_paid)} accent={SERIES[5]} foot="payment completed" />
          <Kpi label="Revenue (incl. GST)" value={fmtINR(k.revenue_incl_gst)} accent={SERIES[0]} />
          <Kpi label="Revenue (excl. GST)" value={fmtINR(k.revenue_excl_gst)} accent={SERIES[2]} />
          <Kpi label="GST Collected" value={fmtINR(k.gst_collected)} accent={SERIES[3]} />
          <Kpi label="Avg Ticket" value={fmtINR(k.avg_ticket)} accent={SERIES[6]} foot="per seller" />
        </KpiStrip>
      )}
      <div className="grid c3">
        <Card title="Revenue by Executive" sub="incl. GST" className="span2 pad">
          <BarList data={p.revenue_by_re} colorByIndex valueFmt={fmtCompact} />
        </Card>
        <Card title="Sellers by Executive"><Donut data={p.sellers_by_re} /></Card>
      </div>
      <div className="grid c3" style={{ marginTop: 16 }}>
        <Card title="Revenue per Day" className="span2 pad">
          <Trend data={p.revenue_by_day} xKey="date" yKey="revenue" label="Revenue" color={SERIES[3]} valueLabel={fmtINR} />
        </Card>
        <Card title="Payment Type"><Donut data={p.by_paytype} /></Card>
      </div>
    </>
  );
}
