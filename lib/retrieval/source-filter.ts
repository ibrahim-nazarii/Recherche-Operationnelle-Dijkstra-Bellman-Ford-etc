export const OFFICIAL_DOMAINS = [
  "eur-lex.europa.eu",
  "legifrance.gouv.fr",
  "hudoc.echr.coe.int",
  "curia.europa.eu",
  "bofip.impots.gouv.fr",
  "conseil-constitutionnel.fr",
  "conseil-etat.fr",
  "juridiction-administrative.fr",
  "judilibre.fr",
  "courdecassation.fr",
  "assemblee-nationale.fr",
  "senat.fr",
  "vie-publique.fr",
  "service-public.fr",
  "autoritedelaconcurrence.fr",
  "amf-france.org"
];

// Helper to check if a URL is official
export function isOfficial(url: string): boolean {
  try {
    const host = new URL(url).host.replace(/^www\./, "");
    // Check if host ends with any of the official domains
    return OFFICIAL_DOMAINS.some(d => host === d || host.endsWith('.' + d));
  } catch {
    return false;
  }
}

export function keepOfficial(urls: string[]): string[] {
  const set = new Set<string>();
  for (const u of urls || []) {
    if (isOfficial(u)) {
      set.add(u);
    }
  }
  return [...set];
}
