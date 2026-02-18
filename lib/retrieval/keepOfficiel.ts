export type Citation = { url: string; title?: string };

type HostRule = {
  host: RegExp; // which host(s) are allowed
  path?: RegExp; // which path patterns are allowed (optional if host alone is sufficient)
  normalize?: (u: URL) => URL | string; // optional canonicalizer
};

/** --- Canonicalization helpers --- */
function stripTracking(u: URL): URL {
  // Remove common tracking/query noise but preserve legally relevant params (e.g., CELEX, i=, uri=)
  const keepKeys = new Set(["uri", "CELEX", "celex", "i", "lang", "locale"]);
  const q = new URLSearchParams();
  for (const [k, v] of u.searchParams.entries()) {
    if (keepKeys.has(k)) q.set(k, v);
  }
  u.search = q.toString() ? `?${q.toString()}` : "";
  // Normalize trailing slash (except when path is root)
  if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
    u.pathname = u.pathname.replace(/\/+$/, "");
  }
  return u;
}

function toCanonical(u: URL): string {
  // Lowercase host, keep https, strip hash except HUDOC (hash carries the doc id)
  const copy = new URL(u.toString());
  copy.protocol = "https:";
  copy.host = copy.host.toLowerCase();
  // HUDOC uses hash/fragment to carry the `i=` id; we keep it only there.
  if (!/hudoc\.echr\.coe\.int$/i.test(copy.host)) copy.hash = "";
  return stripTracking(copy).toString();
}

/** --- Whitelist rules --- */
const RULES: HostRule[] = [
  /** Légifrance (Codes, JORF, LOI, Jurisprudence, LODA) */
  {
    host: /^(www\.)?legifrance\.gouv\.fr$/i,
    path: new RegExp(
      String.raw`^/(codes|jorf|loda|dossier|jurisprudence|conv_coll|droit-europeen)(/|$)` // modern sections
    ),
  },
  // Legacy deep links sometimes appear without the new section prefixes, keep common endpoints:
  {
    host: /^(www\.)?legifrance\.gouv\.fr$/i,
    path: new RegExp(
      String.raw`^/(affich(Code|Texte|Juri|JO)|codes/article|codes/id|jorf/id|loda/id)(/|$)`
    ),
  },

  /** BOFiP (bulletins officiels) */
  {
    host: /^(www\.)?bofip\.impots\.gouv\.fr$/i,
    path: new RegExp(
      String.raw`^/bofip(/|$)` // e.g., /bofip/1160-PGP.html, /bofip/BOI-ENR-DMTG-10-20-40…
    ),
  },

  /** EUR-Lex (EU primary/secondary law) */
  {
    host: /^eur-lex\.europa\.eu$/i,
    path: new RegExp(
      [
        String.raw`^/legal-content/[A-Z]{2}/TXT(/|$)`, // /legal-content/FR/TXT/?uri=CELEX:...
        String.raw`^/eli/(directive|reg|regulation|decision|treaty)/`, // ELI routes
        String.raw`^/search/`, // search results that resolve to CELEX
        String.raw`^/resource\.html`, // resource landing
      ].join("|")
    ),
  },

  /** CURIA (CJUE) */
  {
    host: /^(www\.)?curia\.europa\.eu$/i,
    path: new RegExp(
      [
        String.raw`^/juris/document/document\.jsf`, // canonical doc page
        String.raw`^/juris/liste\.jsf`, // list that links to document.jsf
        String.raw`^/juris/documents/`, // newer paths
        String.raw`^/en/content/juris`, // rare localized paths
      ].join("|")
    ),
  },

  /** HUDOC (ECHR) — fragment/hash often carries the doc id */
  {
    host: /^hudoc\.echr\.coe\.int$/i,
    path: new RegExp(
      [
        String.raw`^/(eng|fre)(/|$)`, // /eng?i=..., /fre?i=...
        String.raw`^/app(lication)?/`, // /app#{...}
      ].join("|")
    ),
    normalize: (u) => {
      // For HUDOC keep hash intact (doc id frequently lives in fragment)
      const c = new URL(u.toString());
      c.protocol = "https:";
      c.host = c.host.toLowerCase();
      return stripTracking(c).toString();
    },
  },
];

/** Decide if a URL is an official legal document link */
export function isOfficialUrl(urlStr: string): string | null {
  let u: URL;
  try {
    u = new URL(urlStr);
  } catch {
    return null;
  }
  const host = u.host.toLowerCase();

  for (const rule of RULES) {
    if (!rule.host.test(host)) continue;
    if (rule.path && !rule.path.test(u.pathname)) continue;
    const normalized = rule.normalize ? rule.normalize(u) : toCanonical(u);
    return typeof normalized === "string" ? normalized : normalized.toString();
  }
  return null;
}

/** Public API: filter a list of citations and deduplicate canonically */
export function keepOfficial<T extends Citation>(citations: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];

  for (const c of citations || []) {
    if (!c?.url) continue;
    const canon = isOfficialUrl(c.url);
    if (!canon) continue;
    if (seen.has(canon)) continue;
    seen.add(canon);
    out.push({ ...c, url: canon });
  }
  return out;
}
