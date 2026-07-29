// Demo-grade, client-side auth (same posture as the TataCliq dashboard).
// NOT real security — see SETUP.md "Known limitation". Two roles:
//   admin  → sees everything + upload + visibility controls
//   client → sees only what admin left visible

export type Role = "admin" | "client";

interface Account {
  email: string;
  password: string;
  role: Role;
}

const ACCOUNTS: Account[] = [
  { email: "flipkart@netscribes.com", password: "Flipkart@2026", role: "admin" },
  { email: "client@netscribes.com", password: "NextGen@2026", role: "client" },
];

const SESSION_KEY = "fk_session_role";

export function login(email: string, password: string): Role | null {
  const acct = ACCOUNTS.find(
    (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password
  );
  if (!acct) return null;
  // in-memory only; also mirrored to a module var so refresh within session keeps it
  currentRole = acct.role;
  return acct.role;
}

let currentRole: Role | null = null;

export function getRole(): Role | null {
  return currentRole;
}

export function logout() {
  currentRole = null;
}

export { SESSION_KEY };
