// ── Deployment config the team edits (see SETUP.md) ─────────────────────────
// Mirrors the TataCliq pipeline: admin uploads Excel → committed to GitHub →
// Action runs generate_json.py → deploys /data JSON to the server the app is
// served from. The client only ever fetches same-origin /data/*.json.

export const config = {
  // GitHub repo that holds this app + the refresh Action.
  github: {
    owner: "ns-adiraghavan",
    repo: "flipkartdb",
    branch: "main",
    // Path in the repo where the admin upload is committed. The Action watches this.
    uploadPath: "data/incoming/latest.xlsx",
  },
  // Where the SPA fetches data from at runtime. Resolves under the Vite base path,
  // so it works both at a domain root and under /flipkartdb/ on GitHub Pages.
  dataBase: `${import.meta.env.BASE_URL}data`,
  brand: {
    title: "Flipkart NextGen Lite",
    subtitle: "Seller Acquisition & Onboarding Command Center",
    org: "Netscribes",
  },
};
