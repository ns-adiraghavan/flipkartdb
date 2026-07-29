import { config } from "./config";

// Commit a file to the repo via the GitHub Contents API using a fine-grained PAT
// held only in memory (never persisted). Mirrors the TataCliq upload route.
async function apiGetSha(path: string, token: string): Promise<string | undefined> {
  const { owner, repo, branch } = config.github;
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
  );
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`GitHub read failed (${res.status})`);
  const j = await res.json();
  return j.sha as string;
}

export async function commitFile(path: string, contentB64: string, message: string, token: string) {
  const { owner, repo, branch } = config.github;
  const sha = await apiGetSha(path, token);
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    body: JSON.stringify({ message, content: contentB64, branch, ...(sha ? { sha } : {}) }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GitHub commit failed (${res.status}): ${t.slice(0, 200)}`);
  }
  return res.json();
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]); // strip data: prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function textToBase64(text: string): string {
  return btoa(unescape(encodeURIComponent(text)));
}
