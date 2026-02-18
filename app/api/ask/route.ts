import { NextRequest, NextResponse } from "next/server";
import { askPerplexity } from "@/lib/llm/perplexity";
import { isOfficial, keepOfficial } from "@/lib/retrieval/source-filter";
import { attachMarkers } from "@/lib/guardrails/attribution";

/** ---------------- SYSTEM PROMPTS ---------------- */
const SYSTEM = [
  "Tu es un assistant juridique spécialisé en droit français, droit de l'Union européenne et CEDH.",
  "Ta mission est de fournir des réponses juridiques exactes et sourcées à partir de textes officiels (Légifrance, Judilibre, BOFiP, EUR-Lex, CURIA, HUDOC, etc.).",
  "Si la question est imprécise, élargis la recherche et reformule en langage juridique pour couvrir les textes pertinents (lois, décrets, jurisprudence, doctrine administrative).",
  "Ne cite jamais de sources non officielles et fournis toujours un lien direct vers le texte officiel.",
  "Toujours citer les sources officielles avec des références claires et traçables [1], [2], etc.",
  "Si, après reformulation et recherche étendue, aucune source officielle n’est trouvée, réponds : « Je ne peux pas confirmer avec une source officielle. »",
  "Structure ta réponse avec les sections suivantes (utilise le Markdown) :",
  "## Résumé",
  "Une réponse directe et concise à la question posée.",
  "## Analyse Juridique",
  "Développement détaillé avec citation des textes applicables.",
  "## Sources",
  "Liste des textes officiels utilisés (Légifrance, EUR-Lex, HUDOC, etc.).",
  "Exprime-toi en français clair, concis et juridiquement rigoureux.",
].join(" ");

const REWRITE_SYSTEM = [
  "Tu es un réécrivain juridique. Ta seule tâche est de transformer une question vague en requête juridique exploitable.",
  "Priorité : rappel (recall). Ajoute la juridiction et les bases officielles pertinentes (Légifrance, Judilibre, BOFiP, EUR-Lex, CURIA, HUDOC).",
  "N'invente pas de dates, d'affaires ou de numéros si l'utilisateur ne les donne pas.",
  "Sors UNIQUEMENT la requête réécrite, sans commentaires.",
].join(" ");

const MODEL_DEFAULT = process.env.PERPLEXITY_MODEL ?? "sonar-pro";
const MODEL_REWRITE = process.env.PERPLEXITY_MODEL_REWRITE ?? MODEL_DEFAULT;
const MODEL_ASK_PRIMARY = process.env.PERPLEXITY_MODEL_ASK ?? MODEL_DEFAULT;
const MODEL_ASK_FALLBACK = process.env.PERPLEXITY_MODEL_FALLBACK ?? MODEL_DEFAULT;

/** ---------------- LIGHT DOMAIN LEXICON ----------------
 * Maps colloquial triggers to canonical sources/keywords.
 * You can extend this safely over time.
 */
const LEXICON: Record<string, string[]> = {
  dutreil: [
    "CGI art. 787 B",
    "CGI art. 787 C",
    "BOFiP-ENR-DMTG-10-20-40",
    "BOFiP-ENR-DMTG-10-20-20",
    "Légifrance",
  ],
  "cession de controle": ["Code de commerce", "Légifrance"],
  rgpd: ["Règlement (UE) 2016/679", "EUR-Lex"],
  "lanceur d'alerte": ["Loi n° 2016-1691 dite Sapin II", "Légifrance"],
  cedh: ["CEDH", "HUDOC", "Cour européenne des droits de l'homme"],
  echr: ["ECHR", "HUDOC", "Cour européenne des droits de l'homme"],
  "cour europeenne des droits de l'homme": ["CEDH", "HUDOC"],
  "convention europeenne des droits de l'homme": ["CEDH", "HUDOC"],
};

function normalizeForMatch(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[’]/g, "'");
}

/** Build a lexicon tail if user query hits any keys */
function lexiconTail(query: string): string {
  const q = normalizeForMatch(query);
  const hits = Object.keys(LEXICON).filter((k) => q.includes(k));
  if (!hits.length) return "";
  const add = new Set<string>();
  hits.forEach((h) => LEXICON[h].forEach((t) => add.add(t)));
  return ` Cibles officielles probables : ${Array.from(add).join(", ")}.`;
}

const ECHR_RE =
  /(cedh|echr|cour europeenne des droits de l'homme|convention europeenne des droits de l'homme|strasbourg)/i;
const EU_RE =
  /(cjue|cjeu|cour de justice|union europeenne|tfue|tue|celex|eur-lex)/i;
const FR_RE =
  /(legifrance|cour de cassation|cassation|conseil d'etat|juridiction administrative|code|loi|decret|arret|jurisprudence)/i;
const TAX_RE = /(bofip|fisc|fiscal|impot|impots|tva|cgi)/i;

function sourceHintTail(query: string): string {
  const q = normalizeForMatch(query);
  const hints = new Set<string>();
  const isEchr = ECHR_RE.test(q);
  const isEu = EU_RE.test(q);
  const isFr = FR_RE.test(q);
  const isTax = TAX_RE.test(q);

  if (isEchr) {
    ["HUDOC", "CEDH", "Cour européenne des droits de l'homme"].forEach((h) =>
      hints.add(h)
    );
  }
  if (isEu) {
    ["EUR-Lex", "CURIA", "CELEX"].forEach((h) => hints.add(h));
  }
  if (isTax) {
    ["BOFiP", "CGI", "Légifrance"].forEach((h) => hints.add(h));
  }
  if (isFr || (!isEchr && !isEu)) {
    ["Légifrance", "Judilibre"].forEach((h) => hints.add(h));
  }

  if (!hints.size) {
    ["Légifrance", "EUR-Lex", "HUDOC", "CURIA", "BOFiP"].forEach((h) =>
      hints.add(h)
    );
  }

  return hints.size
    ? ` Bases officielles pertinentes : ${Array.from(hints).join(", ")}.`
    : "";
}

function buildHintTail(query: string): string {
  const lex = lexiconTail(query);
  const src = sourceHintTail(query);
  if (!lex && !src) return "";
  return [lex, src].filter(Boolean).join(" ");
}

function buildSearchQuery(rewritten: string, original: string): string {
  const tail = buildHintTail(original);
  return tail ? `${rewritten}\n\n${tail}` : rewritten;
}

/** Ask Perplexity to rewrite the user query into legalese */
async function rewriteQuery(userQuery: string): Promise<string> {
  const seedTail = buildHintTail(userQuery);
  const toRewrite =
    userQuery +
    (seedTail
      ? `\n\n${seedTail}`
      : " Reformule en précisant les textes (code, article, BOFiP, décision, etc.).");

  const { text } = await askPerplexity(toRewrite, REWRITE_SYSTEM, {
    model: MODEL_REWRITE,
  });
  // minimal safety net: trim and cap length
  return (text || "").trim().slice(0, 800);
}

/** One shot ask with your main SYSTEM */
async function askOnce(query: string, model: string) {
  const { text, citations } = await askPerplexity(query, SYSTEM, { model });
  return { text, citations: citations || [] };
}

/** Hard fallback that forces the model to stay in official domains */
function forceOfficialHint(q: string): string {
  // We DO NOT force “site:” operators at network level; we steer the model with a hard hint.
  return [
    q,
    " Ne cite et ne consulte que des sources officielles : Légifrance, Judilibre, EUR-Lex, BOFiP, HUDOC, CURIA.",
    " Fournis l'extrait exact du texte et le lien direct.",
  ].join(" ");
}

function uniqueModels(models: string[]): string[] {
  return models.filter((m, i) => m && models.indexOf(m) === i);
}

async function askWithModelFallbacks(query: string, models: string[]) {
  let lastError: unknown;
  for (const model of models) {
    try {
      return await askOnce(query, model);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error("Perplexity model fallback failed.");
}

/** Process citations to keep only official ones and generate a mapping for re-indexing */
function processCitations(citations: string[]) {
  const officialUrls: string[] = [];
  const mapping = new Map<number, number>();
  const urlToNewId = new Map<string, number>();

  for (let i = 0; i < citations.length; i++) {
    const url = citations[i];
    if (isOfficial(url)) {
      let newId = urlToNewId.get(url);
      if (newId === undefined) {
        officialUrls.push(url);
        newId = officialUrls.length;
        urlToNewId.set(url, newId);
      }
      mapping.set(i + 1, newId);
    }
  }
  return { officialUrls, mapping };
}

/** --------------- POST HANDLER --------------- */
export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query)
    return NextResponse.json({ error: "missing query" }, { status: 400 });

  try {
    // 1) Rewrite vague query -> legalese
    const rewritten = await rewriteQuery(query);

    // 2) First attempt
    const expanded = buildSearchQuery(rewritten, query);
    const attempts = [expanded, rewritten, buildSearchQuery(query, query)].filter(
      (q, i, arr) => q && arr.indexOf(q) === i
    );

    let text = "";
    let citations: string[] = [];
    let officialUrls: string[] = [];
    let mapping = new Map<number, number>();

    const askModels = uniqueModels([
      MODEL_ASK_PRIMARY,
      MODEL_ASK_FALLBACK,
      MODEL_DEFAULT,
    ]);

    for (const attempt of attempts) {
      ({ text, citations } = await askWithModelFallbacks(attempt, askModels));
      ({ officialUrls, mapping } = processCitations(citations));
      if (officialUrls.length) break;
    }

    // 3) Fallback: force an “official-only” search style if needed
    if (!officialUrls.length) {
      const forced = forceOfficialHint(expanded);
      ({ text, citations } = await askWithModelFallbacks(forced, askModels));
      ({ officialUrls, mapping } = processCitations(citations));
    }

    // 4) Final guardrail
    if (!officialUrls.length) {
      return NextResponse.json({
        answer: "Je ne peux pas confirmer avec une source officielle.",
        sources: [],
        guardrail_notes: ["No official sources present in citations."],
        debug: { rewritten }, // optional: remove in prod
      });
    }

    const { text: answer, sources } = attachMarkers(text, officialUrls, mapping);
    return NextResponse.json({ answer, sources, debug: { rewritten } }); // optional: remove debug
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "error" }, { status: 500 });
  }
}
