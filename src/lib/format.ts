export function formatViews(n: number | null | undefined): string {
  const v = n ?? 0;
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(v);
}

export function timeAgo(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dd = Math.floor(h / 24);
  if (dd < 30) return `${dd}d ago`;
  const mo = Math.floor(dd / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export function extractIframeSrc(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // raw url
  try {
    const u = new URL(trimmed);
    if (u.protocol.startsWith("http")) return u.toString();
  } catch {}
  const m = trimmed.match(/src\s*=\s*["']([^"']+)["']/i);
  if (m) {
    try {
      const u = new URL(m[1]);
      if (u.protocol.startsWith("http")) return u.toString();
    } catch {}
  }
  return null;
}

const LINK_RE = /(https?:\/\/|www\.|bit\.ly|\.com\b|\.net\b|\.org\b|\.io\b|\.co\b)/i;
export function containsLink(text: string): boolean {
  return LINK_RE.test(text);
}

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}