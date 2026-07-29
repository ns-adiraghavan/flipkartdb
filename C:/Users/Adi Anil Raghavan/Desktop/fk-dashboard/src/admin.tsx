import { useState } from "react";
import { config } from "./config";
import type { Visibility, TabKey } from "./types";
import { commitFile, fileToBase64, textToBase64 } from "./github";

const TAB_LABELS: Record<TabKey, string> = {
  overview: "Overview", leads: "Leads", bd: "BD Calling",
  kam: "KAM Calling", quality: "BD Quality", payment: "Payment",
};

export function AdminPanel({ visibility, onVisibilityChange }: {
  visibility: Visibility;
  onVisibilityChange: (v: Visibility) => void;
}) {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<{ msg: string; kind: "ok" | "err" | "info" } | null>(null);
  const [busy, setBusy] = useState(false);

  const setTab = (t: TabKey, v: boolean) =>
    onVisibilityChange({ ...visibility, tabs: { ...visibility.tabs, [t]: v } });
  const setKpi = (t: TabKey, v: boolean) =>
    onVisibilityChange({ ...visibility, kpiStrips: { ...visibility.kpiStrips, [t]: v } });

  const needToken = () => {
    if (!token.trim()) { setStatus({ msg: "Paste a GitHub PAT first.", kind: "err" }); return false; }
    if (config.github.owner.startsWith("YOUR_")) {
      setStatus({ msg: "Set github.owner/repo in src/config.ts before uploading (see SETUP.md).", kind: "err" });
      return false;
    }
    return true;
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!needToken()) { e.target.value = ""; return; }
    setBusy(true);
    setStatus({ msg: `Uploading ${file.name}…`, kind: "info" });
    try {
      const b64 = await fileToBase64(file);
      await commitFile(config.github.uploadPath, b64, `data refresh: ${file.name}`, token);
      setStatus({ msg: "Uploaded. The refresh Action is now regenerating the dashboard data — reload in ~1–2 min.", kind: "ok" });
    } catch (err: any) {
      setStatus({ msg: err.message, kind: "err" });
    } finally {
      setBusy(false); e.target.value = "";
    }
  };

  const saveVisibility = async () => {
    if (!needToken()) return;
    setBusy(true);
    setStatus({ msg: "Saving visibility…", kind: "info" });
    try {
      const json = JSON.stringify(visibility, null, 2);
      await commitFile("public/data/visibility.json", textToBase64(json), "update client visibility", token);
      setStatus({ msg: "Visibility saved. It applies to the client on their next reload.", kind: "ok" });
    } catch (err: any) {
      setStatus({ msg: err.message, kind: "err" });
    } finally { setBusy(false); }
  };

  return (
    <div className="admin-bar">
      <h3>⚙︎ Admin Controls</h3>
      <div className="desc">
        Upload a new <b>FK Dashboard Reports</b> Excel to refresh all tabs, and choose what the client sees.
        The PAT stays in memory only.
      </div>
      <div className="row">
        <input type="text" placeholder="GitHub fine-grained PAT (Contents: R/W)" value={token}
          onChange={(e) => setToken(e.target.value)} />
        <label className="ghost-upload">
          <input type="file" accept=".xlsx" onChange={onUpload} disabled={busy} style={{ display: "none" }} />
          <span className="btn-file">⬆ Upload Excel</span>
        </label>
        <button className="ghost" onClick={saveVisibility} disabled={busy}>Save visibility</button>
      </div>

      <div className="divider" />
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "#7a5a1c" }}>Client visibility — tabs</div>
      <div className="toggles">
        {(Object.keys(TAB_LABELS) as TabKey[]).map((t) => (
          <label className="toggle" key={t}>
            <input type="checkbox" checked={visibility.tabs[t]} onChange={(e) => setTab(t, e.target.checked)} />
            {TAB_LABELS[t]}
          </label>
        ))}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, margin: "12px 0 8px", color: "#7a5a1c" }}>Client visibility — KPI strips</div>
      <div className="toggles">
        {(Object.keys(TAB_LABELS) as TabKey[]).map((t) => (
          <label className="toggle" key={t}>
            <input type="checkbox" checked={visibility.kpiStrips[t]} onChange={(e) => setKpi(t, e.target.checked)} />
            {TAB_LABELS[t]}
          </label>
        ))}
      </div>

      {status && (
        <div className="status" style={{
          color: status.kind === "err" ? "#c0392b" : status.kind === "ok" ? "#0a7d19" : "#7a5a1c",
        }}>{status.msg}</div>
      )}
    </div>
  );
}

export function Login({ onLogin }: { onLogin: (email: string, pw: string) => boolean }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onLogin(email, pw)) setErr("Invalid email or password.");
  };
  return (
    <div className="login">
      <form className="box" onSubmit={submit}>
        <div className="logo"><span className="fk-mark" /> {config.brand.title}</div>
        <div className="sub">{config.brand.subtitle}</div>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@netscribes.com" autoFocus />
        <label>Password</label>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
        <button type="submit">Sign in</button>
        <div className="err">{err}</div>
        <div className="hint">
          Demo access — admin: <b>flipkart@netscribes.com</b> / <b>Flipkart@2026</b><br />
          client: <b>client@netscribes.com</b> / <b>NextGen@2026</b>
        </div>
      </form>
    </div>
  );
}
