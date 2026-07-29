import { useEffect, useMemo, useState } from "react";
import "./theme.css";
import { config } from "./config";
import { login, logout, getRole, type Role } from "./auth";
import { loadAll, type AllData } from "./data/store";
import type { TabKey, Visibility } from "./types";
import { Overview, Leads, BdCalling, KamCalling, Quality, Payment } from "./tabs";
import { AdminPanel, Login } from "./admin";

const TABS: { key: TabKey; label: string; ico: string }[] = [
  { key: "overview", label: "Overview", ico: "◉" },
  { key: "leads", label: "Leads", ico: "≡" },
  { key: "bd", label: "BD Calling", ico: "☎" },
  { key: "kam", label: "KAM Calling", ico: "★" },
  { key: "quality", label: "BD Quality", ico: "✓" },
  { key: "payment", label: "Payment", ico: "₹" },
];

export default function App() {
  const [role, setRole] = useState<Role | null>(getRole());
  const [data, setData] = useState<AllData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");
  const [vis, setVis] = useState<Visibility | null>(null);

  useEffect(() => {
    if (!role) return;
    loadAll()
      .then((d) => { setData(d); setVis(d.visibility); })
      .catch((e) => setErr(e.message));
  }, [role]);

  const isAdmin = role === "admin";
  const visibility = vis ?? data?.visibility ?? null;

  const visibleTabs = useMemo(() => {
    if (isAdmin || !visibility) return TABS;
    return TABS.filter((t) => visibility.tabs[t.key]);
  }, [isAdmin, visibility]);

  useEffect(() => {
    if (visibleTabs.length && !visibleTabs.find((t) => t.key === tab)) {
      setTab(visibleTabs[0].key);
    }
  }, [visibleTabs, tab]);

  if (!role) {
    return <Login onLogin={(e, p) => { const r = login(e, p); if (r) setRole(r); return !!r; }} />;
  }

  if (err) return <div style={{ padding: 40, color: "#c0392b" }}>Failed to load data: {err}</div>;
  if (!data || !visibility) return <div style={{ padding: 40, color: "#898781" }}>Loading dashboard…</div>;

  const showKpi = (t: TabKey) => isAdmin || visibility.kpiStrips[t];
  const activeMeta = TABS.find((t) => t.key === tab)!;

  const renderTab = () => {
    const props = { d: data, showKpi: showKpi(tab) };
    switch (tab) {
      case "overview": return <Overview {...props} />;
      case "leads": return <Leads {...props} />;
      case "bd": return <BdCalling {...props} />;
      case "kam": return <KamCalling {...props} />;
      case "quality": return <Quality {...props} />;
      case "payment": return <Payment {...props} />;
    }
  };

  const gen = data.meta.generated_at ? new Date(data.meta.generated_at).toLocaleString("en-IN") : "—";

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo"><span className="fk-mark" /> {config.brand.title}</div>
          <div className="sub">{config.brand.subtitle}</div>
        </div>
        <nav className="nav">
          {visibleTabs.map((t) => (
            <button key={t.key} className={t.key === tab ? "active" : ""} onClick={() => setTab(t.key)}>
              <span className="ico">{t.ico}</span> {t.label}
            </button>
          ))}
        </nav>
        <div className="footer">
          <div>Signed in as</div>
          <div className="who">{isAdmin ? "Administrator" : "Client"}</div>
          <button onClick={() => { logout(); setRole(null); setData(null); }}>Sign out</button>
          <div className="powered">
            <span>Powered by</span>
            <img src={`${import.meta.env.BASE_URL}netscribes-white.png`} alt="Netscribes" />
          </div>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div>
            <h1>{activeMeta.label}</h1>
            <div className="meta">{config.brand.org} · data updated {gen} · source {data.meta.source || "—"}</div>
          </div>
          <div className="right">
            <span className={`badge ${isAdmin ? "admin" : ""}`}>{isAdmin ? "ADMIN" : "CLIENT VIEW"}</span>
          </div>
        </div>
        <div className="content">
          {isAdmin && <AdminPanel visibility={visibility} onVisibilityChange={setVis} />}
          {renderTab()}
        </div>
      </div>
    </div>
  );
}
