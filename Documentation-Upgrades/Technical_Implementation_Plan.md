Phase 1 — Technical Implementation Plan (FR/EU focus)
0) Objectives & non-negotiables
	Deliverables:
	Conversational legal Q&A with verifiable, linked citations (FR/EU/ECHR).
	Drafting (memos/letters/emails/clauses) with citation insertion.
	Case/document summarization (by citation or uploaded file).
	Document upload → private Q&A / semantic search.
	Basic alerts: JORF (FR OJ) + EUR-Lex updates.
	Guardrails: every legal proposition must show at least one official source link; quotes with pinpoint; no source → say so.
	Built to scale: data model, storage, and retrieval choices should prepare for Phase 2 (citator-lite) & Phase 3 (DMS “ask my firm”).
 
1) High-level architecture (modular, cloud-agnostic)
Ingestion & Curation
	Orchestrator: Dagster (or Airflow)
	Fetchers: Python workers (FastAPI tasks)
	Storage:
	Object: S3-compatible (original XML/HTML/PDF)
	Raw/bronze: parquet in data lake (S3)
	Curated/silver: PostgreSQL (metadata, IDs, joins)
	Search:
	Text index: OpenSearch (BM25 + aggregations)
	Vector index: pgvector (Postgres) to start; upgradable to Qdrant later
	Graph (for Phase 2): Neo4j optional; for Phase 1, store edges as tables in Postgres
Serving
	API: FastAPI (Python), async, OpenAPI-first
	RAG runtime: LangChain or LlamaIndex (choose one; this plan shows LangChain blocks)
	Files: TUS or multipart upload → S3; antivirus + MIME validation
	AuthN/Z: OIDC (Auth0/AzureAD), JWT between FE/BE
	UI: Next.js (React + TypeScript), Tailwind + shadcn/ui
	Observability: OpenTelemetry → Grafana/Tempo/Loki, Prometheus metrics; Langfuse for LLM tracing/evals
	Secrets: cloud KMS + Vault/SOPS
Models (pragmatic baseline)
	LLM for generation: hosted frontier model (e.g., GPT-4-class or Claude-class) + fallback OSS (e.g., Llama-3.1-70B-Instruct) via vLLM; configurable by tenant
	Embeddings: bge-m3 (multilingual FR/EN) or e5-multilingual-large; fallback text-embedding-3-large if allowed
	Cross-encoder reranker: bge-reranker-v2-m3 (multilingual)
	NER/regex helpers for citations: spaCy-FR + custom rules
 
2) Data ingestion & normalization
2.1 Source-by-source fetch strategy
	Légifrance (DILA): use official API for codes/legislation + JORF; incremental by updated_at / NOR / versioned CELEX links.
	Judilibre (Cour de cassation / cours d’appel): API pull; page through; store ECLI, chamber, formation, dates, summaries, text.
	Justice administrative (CE/CAA/TA): bulk XML dumps + search API (where offered); hash-based deduping.
	EUR-Lex: web service + CELLAR dumps; parse CELEX, sector, directory codes, language variants.
	CJEU: ingest case metadata (ECLI/CELEX mapping) + full texts where permitted.
	ECHR (HUDOC): API + bulk data; map ECLI if present; store headnotes & paragraphs.
	Autorité de la concurrence / CNIL / Info-financière / BOAMP / BODACC / INPI: use provided APIs/RSS/dumps; normalize to a RegulatoryItem schema.
All fetchers run under Dagster jobs with idempotent checkpoints, exponential backoff, and per-source rate limits.
2.2 Document model (curated layer / Postgres)
Tables (core):
	document: doc_id (uuid), source, source_doc_id, title, date_pub, date_effective, language, jurisdiction, uri_official, license, hash, ingested_at
	document_version: links to document, valid_from, valid_to, version_id, celex/ecli/nor
	section: paragraph-level rows — section_id, doc_id, idx, heading, text, pinpoint_ref (e.g., §, article)
	citation: normalized outbound citations with fields (from_doc_id, to_identifier, type=law/case/regulation, pinpoint_from, pinpoint_to, confidence)
	reg_item: for regulators (CNIL/ADLC/BOAMP/BODACC/INPI) with entity/company refs
	entity: companies/persons/public bodies; for alerts/due diligence context
	doc_entity_link: NER-derived links (company, sector, regulator)
2.3 Cleaning & enrichment
	Canonical IDs: map CELEX↔ECLI↔NOR where possible; keep alias table.
	Language & tokenization: FR baseline; detect EN for EU/ECHR; store language code on section.
	Chunking: semantic paragraph chunks with hard limits (e.g., 1–2k chars); avoid splitting articles/§.
	Citation extraction: hybrid rules + ML:
	Regex patterns for FR (e.g., “C. civ., art. 1240”, “Cass., com., 12 juin 2019, n° …”, ECLI/CELEX).
	Validate against catalogs to set confidence.
	Deduplication: shingling + MinHash on stripped text; keep latest consolidated versions but preserve historical via document_version.
	Embeddings:
	Store section-level vectors in section_embedding(doc_id, section_id, embedding, model, created_at).
	Also compute document-level “title+abstract” vectors for coarse recall.
	Rerank corpus: build BM25 index in OpenSearch (doc + section indices with jurisdiction, date, entity facets).
2.4 Update cadence & lineage
	Each source has incremental jobs; expose freshness in UI (“EUR-Lex updated 3h ago”).
	All tables have ingest_run_id; lineage tracked in Dagster + data catalog (Amundsen or DataHub).
 
3) Retrieval & RAG design (ground-truth first)
3.1 Query understanding
	Router (LangChain LCEL graph):
	Detect intent: Q&A vs. Draft vs. Summarize vs. Upload-Q&A vs. Alert setup.
	Detect scope: FR only / EU / ECHR / Mixed; time horizon (e.g., “as of 2018”).
	Extract entities (companies, regulators), topics (privacy, competition), citation strings.
	Normalization: If the user gives a citation (ECLI/CELEX/NOR/reference), resolve directly to doc_id → skip lexical recall.
3.2 Hybrid retrieval (per intent)
	Lexical: OpenSearch BM25 query with query-parser expansions (legal synonyms/abbreviations).
	Vector: pgvector ANN (HNSW) on section embeddings, filtered by jurisdiction, date range, language.
	Dense→lexical fusion: reciprocal rank fusion (RRF) of BM25 top-k and vector top-k (k=50 each → RRF → top-20).
	Cross-encoder rerank: bge-reranker on top-20 → final top-8 context chunks.
	Cite-First bias: if the query extracts a citation, pin those sections first.
3.3 Grounding pack & answer assembly
	Context builder:
	Consolidate pinpoint paragraphs; include preceding/following paragraph when needed.
	Deduplicate overlapping chunks; enforce token budget cap.
	Attribution envelope (passed to LLM):
	For each chunk: title, jurisdiction, date, official URL, pinpoint label, and verbatim quote.
	Rule: “Your answer must cite by [n] markers; every substantive sentence must be traceable to a source in the Context. If unknown, say so.”
	Post-gen verifier:
	Regex-check that every [n] appears in sources;
	Quote-to-source similarity (cosine on sentence embeddings) for each inline quote;
	If a sentence lacks attribution → append “No authoritative source found.”
3.4 Structured outputs
	Q&A: Short answer → bullet reasoning → linked citations with pinpoints (render from official URLs).
	Summarizer: “Facts / Issues / Reasoning / Holding / Key cites”.
	Drafting: Insert in-text footnotes like “1 [case, §]”.
 
4) Feature implementation details
4.1 Conversational Q&A with linked citations
	Endpoint: POST /v1/qa
	body: { query, scope, date_asof?, jurisdiction_filters?, language='fr', user_id? }
	Flow: intent → hybrid retrieval → rerank → LLM → verifier → response JSON with citations[]:
	{ id, title, uri_official, jurisdiction, date, pinpoints:[{label, anchor}], quote_snippets:[] }
	UI: right rail “Sources” with copyable cites; hover to preview quoted paragraph; click → official site.
4.2 Regulatory/authority content in answers
	Index CNIL/ADLC/Info-financière items alongside case law.
	Add facet filters (regulator: CNIL, topic: sanction, company: <RNE id>).
	Render a “Regulatory” tab in results with decisions/notices; same citation UX.
4.3 Drafting (memos/letters/emails/clauses)
	Templates stored in a YAML repo; variables (parties, dates, jurisdiction).
	Endpoint: POST /v1/draft with {purpose, constraints, tone, length, include_citations: true}
	Uses the same retrieval pack to ground any legal propositions; emits Word/Markdown:
	Backend builds .docx via python-docx; downloads available.
4.4 Case/document summarization
	By citation: POST /v1/summarize?identifier=ECLI/CELEX/NOR → resolves, fetches sections, produces 5-part summary + cites.
	By file: see 4.5; after ingest to temp index, same summarizer.
4.5 Document upload Q&A / semantic search
	Upload: POST /v1/files (virus scan; type check).
	Ephemeral store: S3 key with short TTL; metadata in user_files table.
	Temporary index: compute embeddings, create a transient per-user pgvector table namespace (or a single multi-tenant table keyed by user_id).
	Privacy: hard delete on session end or explicit expiry (e.g., 24h); UI banner states policy.
	Q&A: POST /v1/qa_files mixes user docs top-k with public law top-k, with user-docs given 1.2× weight in RRF.
4.6 Alerts: JORF / EUR-Lex
	Backend scheduler (Dagster or cloud cron) runs watchlists:
	Users define queries (e.g., “RGPD”, “aides d’État”, CELEX sectors) + jurisdictions.
	Persist as alert_rule with DSL (source, filters, keywords, frequency).
	Matching: new/updated items buffered per source; run BM25 match + keyword filters; store alert_hit.
	Notification: email (SendGrid) + in-app feed; digest format with official links & short summaries.
 
5) Frontend (Next.js + TypeScript + Tailwind)
	Pages:
	/ Chat Q&A (scope selector: FR / EU / ECHR / Mixed; date “as of …”)
	/draft Drafting workspace (template selector; tone/length controls)
	/summarize Paste citation or upload file
	/uploads Private files list (TTL badges)
	/alerts Create/manage watchlists
	Components:
	SourceCard: title, jurisdiction, date, official link, copy citation; hover shows pinpoint paragraph.
	CiteInline: renders [1], [2] markers that scroll to SourceCard.
	FreshnessBadge: “EUR-Lex updated 2h ago”
	State: React Query (TanStack) for data fetching; Zod for schema validation.
 
6) Security, privacy, compliance
	At rest: S3/SSE-KMS; Postgres TDE; secrets in KMS.
	In transit: TLS 1.2+; signed URLs for downloads.
	Uploads: AV scan (ClamAV), PDF text extraction via OCR disabled by default (opt-in).
	PII & anonymization: keep original anonymization from sources; no deanonymization attempts.
	Isolation: multi-tenant via row-level security on Postgres; per-tenant S3 prefixes.
 
7) Quality & evaluation (ship with a harness)
	Retrieval metrics: Recall@k, MRR using a gold set of 300 FR/EU/ECHR Q→Citations.
	Grounding score: % sentences with valid [n] markers that point to matching quoted text (cosine ≥ 0.85).
	Factuality audits: weekly sample of 100 answers; human checklist (correct rule, correct scope, correct quote).
	Latency SLOs:
	Retrieval ≤ 600 ms (P95),
	Rerank ≤ 200 ms,
	LLM ≤ configurable,
	End-to-end target ≤ 4–6 s P95.
	Safety: reject questions outside scope (e.g., medical) or clearly label when not legal advice.
 
8) APIs (sketch)
POST /v1/qa
POST /v1/summarize
POST /v1/draft
POST /v1/files             # upload
POST /v1/qa_files
POST /v1/alerts            # create rule
GET  /v1/alerts            # list rules
GET  /v1/alerts/hits       # recent matches
GET  /v1/health            # per-source freshness, index status
Admin / internal
POST /_admin/reindex?source=judilibre
GET  /_admin/freshness
GET  /_admin/evals/retrieval
 
9) Data model add-ons for future phases (cheap to add now)
	edge_citation table (from_doc_id, to_doc_id, verb, signal?, evidence_section_id[])
→ Enables Phase 2 “citator-lite” without reprocessing.
	org_repo table for Phase 3 DMS connectors (metadata only in P1).
	pinpoint_anchor table to pre-compute anchors for official URLs (CSS selectors or paragraph IDs).
 
10) Build order & cut lines (what to do first)
	Pipelines & schemas (Postgres + S3 + OpenSearch + pgvector)
	Ingest FR primary (Légifrance + Judilibre) → embeddings + BM25
	Q&A minimal (hybrid retrieval + rerank + grounding + citations UI)
	Summarizer + Drafting (reuse retrieval)
	EUR-Lex + ECHR ingestion
	Uploads (ephemeral indexing)
	Alerts (JORF/EUR-Lex)
	Regulators (CNIL/ADLC/Info-financière, BOAMP, BODACC)
	Polish (pinpoint previews, freshness badges, evaluation harness)
 
11) Concrete technology choices (swap-friendly)
	Backend: Python 3.11, FastAPI, uvicorn, pydantic, tenacity (retry)
	Pipelines: Dagster, dbt (for SQL transforms), Poetry for deps
	Databases: Postgres 15 (+ pgvector), OpenSearch 2.x, S3-compatible object store
	RAG: LangChain (LCEL), sentence-transformers (bge-m3), FlagEmbedding reranker
	LLM access: provider-agnostic wrapper (OpenAI/Anthropic/Azure/OpenRouter) + vLLM for OSS
	FE: Next.js 14 App Router, Tailwind, shadcn/ui, React Query, Zod
	Obs: OpenTelemetry SDK, Prometheus, Grafana, Langfuse
	CI/CD: GitHub Actions, Poetry + pytest, Trivy (images), Snyk (deps)
	Infra: Kubernetes (KEDA for workers), Terraform + Helm
 
12) Acceptance criteria (Phase 1 “done”)
	Q&A: For a curated 100-question FR/EU set, ≥90% answers contain at least 2 authoritative citations with working official links; ≥85% of quoted snippets match source paragraphs.
	Summarizer: Given ECLI/CELEX, returns 5-part summary with ≥2 pinpoints.
	Drafting: Generates a 1–2 page memo/letter with footnoted citations; export to .docx works.
	Uploads: A 10-page PDF can be queried; deletion removes vectors & file.
	Alerts: Users can create a rule; at least one EUR-Lex and one JORF hit observed in staging during a week of testing.
	Freshness UI shows last successful sync per source.
 
Final notes
	This plan front-loads correctness and verifiability (pinpoints, quotes, official links), which is the core Lexis+ AI trust pattern.
	All storage and schemas are future-proofed so Phase 2 (citator-lite) is a data science task, not a re-platform.
	If you want, I can turn this into a task-level PRD (tickets, owner, DOD) or a dbt model spec for each table next.

