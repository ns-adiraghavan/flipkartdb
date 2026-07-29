import type { AllData } from "./data/store";
import { Kpi, KpiStrip, Card, BarList, Funnel, fmt, fmtINR, fmtCompact, SERIES } from "./components/ui";
import { Donut, VBars, GroupedBars, Trend, PctBars } from "./components/charts";

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
export function Leads({ d, showKpi }: { d: AllData; showKpi: boolean }) {
  const l = d.leads; const k = l.kpis;
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
