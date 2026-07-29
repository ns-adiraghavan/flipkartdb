# FK NextGen Lite — Dashboard Setup

A Vite + React SPA that visualizes the **FK Dashboard Reports** workbook across six
tabs (Overview, Leads, BD Calling, KAM Calling, BD Quality, Payment). Same
architecture as the TataCliq TAT dashboard: **data is fetched at runtime** from
`/data/*.json`, so a refresh means "drop new JSON in `/data`" — no rebuild.

```
Excel workbook ─► scripts/generate_json.py ─► /data/*.json ─► SPA fetches at runtime
```

## 1. Run locally

```bash
npm install
# generate the JSON from a workbook into public/data
EXCEL_PATH="/path/to/FK Dashboard Reports.xlsx" OUTPUT_DIR="public/data" python3 scripts/generate_json.py
npm run dev
```

The repo already ships with generated JSON, so `npm run dev` works out of the box.

### Logins (demo-grade, client-side — see "Security" below)
- **Admin:** `flipkart@netscribes.com` / `Flipkart@2026` — sees everything, plus the
  upload panel and client-visibility toggles.
- **Client:** `client@netscribes.com` / `NextGen@2026` — sees only the tabs / KPI
  strips the admin left visible.

Change these in `src/auth.ts`.

## 2. Push to GitHub, then deploy on Vercel

Same model as the TataCliq dashboard. `base` is `'/'` and `vercel.json` handles SPA
routing — no extra config.

```bash
# from the unzipped fk-dashboard/ folder
git init
git add .
git commit -m "FK NextGen Lite dashboard"
git branch -M main
git remote add origin https://github.com/ns-adiraghavan/flipkartdb.git
git push -u origin main
```

Then in Vercel: **New Project → Import `ns-adiraghavan/flipkartdb`** → framework
auto-detects as **Vite** (build `npm run build`, output `dist`) → **Deploy**. The
dashboard goes live with the data already baked in. Every future `git push` to `main`
auto-redeploys.

## 3. Refreshing the data (works on Vercel **and** the EC2 domain)

Refresh is driven entirely through the repo — exactly like TataCliq:

1. Admin clicks **Upload Excel** → the new workbook is committed to
   `data/incoming/latest.xlsx` via the GitHub API (PAT held in memory only).
2. `.github/workflows/refresh.yml` runs `scripts/generate_json.py` and **commits the
   regenerated `public/data/*.json` back into the repo**.
3. That commit is picked up by whichever host serves the app:
   - **Vercel** auto-redeploys on the push and serves the fresh `/data`.
   - **EC2** (the live production domain): `git pull` — run manually or as a 1-minute
     cron — updates the checkout, and nginx serves it at `/data`. Same as the TAT box.

The **Save visibility** button commits `public/data/visibility.json` the same way (no
Action needed — it's served directly).

**Fine-grained PAT** — create one scoped to the `flipkartdb` repo with **Contents:
Read/Write** (GitHub → Settings → Developer settings → Fine-grained tokens) and set
`github.owner/repo` in `src/config.ts` (already set to `ns-adiraghavan/flipkartdb`). The
admin pastes the PAT into the panel at runtime; it is held in memory only, never
persisted, and never reaches a client browser.

### EC2 host notes (production domain)
Serve the built app and point the URL path `/data` at the repo's `public/data` folder
(or a folder you `git pull` into). A 1-minute cron keeps it live:

```cron
* * * * * cd /var/www/flipkartdb && git pull --quiet
```

Raw uploaded workbooks (`data/incoming/*.xlsx`) are git-ignored locally so PII isn't
committed by accident; the admin upload still lands them in the repo via the API, which
is what the refresh Action consumes.

## 4. Visibility

Admin toggles per-tab show/hide and per-tab KPI-strip show/hide, then **Save
visibility**. Admin always sees everything; the client view reflects the saved file
on next reload. Scope is tab-level + KPI-strip-level (not individual KPI cards).

## Data notes
- Counts are **raw dumps as-is** (every row counted; e.g. 6,754 BD call records) —
  traceable straight back to the sheet.
- Sheets used: Kam DUMP, BD DUMP, BD Internal Quality, Leads, Payment Tracking.
  Helper tabs (Sort, Unique, Pivot*, Index) are ignored.
- The generator normalizes casing (e.g. `Super urgent`/`Super Urgent`, `yes`/`Yes`).
- Several funnels are thin today (KAM 41, QA 15, Payment 13) but rich upstream
  (Leads 81k, BD 6.7k). The scaffolding is built to fill out as those grow.

## Security (known limitation, carried over from TAT)
Login is client-side and bypassable, and the admin PAT is readable in-session. For a
hardened version, add a small backend that holds the token and does real session
auth; the frontend already fetches `/data`, so that change stays localized.
