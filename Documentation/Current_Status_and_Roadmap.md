# Current Implementation Status & Roadmap

## 1. Current Implementation Status

The project is currently a **functional prototype** (MVP) built with Next.js, relying on external APIs for intelligence and in-memory storage for session data.

### Architecture
- **Frontend/Backend Framework**: Next.js 14 (App Router).
- **Styling**: Tailwind CSS.
- **Language**: TypeScript.
- **Authentication**: None (Session ID via cookies for ephemeral state).
- **Database**: None (In-memory `Map` for session-based file storage).

### Key Features Implemented

#### 1. Conversational Legal Q&A (`/`, `/api/ask`)
- **Logic**: Uses **Perplexity API** (`sonar-medium-online` or similar implied) to fetch answers and citations.
- **Query Rewriting**: "User query" → "Legalese query" transformation step using LLM to improve retrieval.
- **Guardrails**:
  - `keepOfficial` filter: Ensures citations come only from allowed domains (legifrance.gouv.fr, curia.europa.eu, etc.).
  - Fallback mechanism: Forces "official sources only" prompt if first attempt fails.
  - Attribution: Tries to link `[1]` markers in text to the returned sources.

#### 2. Document Analysis (Upload & Chat) (`/api/upload`, `/api/ask-doc`)
- **Ingestion**: `pdf-parse` extracts text from uploaded PDFs.
- **Storage**: **In-memory Vector Store** (Global Map variable). This is ephemeral and not scalable.
- **Retrieval**: Brute-force Cosine Similarity (JS implementation) over OpenAI embeddings (`text-embedding-3-small` implied).
- **Chunking**: Simple text chunking logic.

#### 3. Drafting & Summarization (`/draft`, `/summarize`)
- **Drafting**: Template-based generation (Memos, Emails) exporting to `.docx` (`html-to-docx`).
- **Summarization**: Capable of summarizing text based on "Lenses" (e.g., Facts, Procedure, Ruling).

### Limitations
- **No Persistence**: Uploaded files and chat history are lost on server restart (in-memory).
- **Dependency on Perplexity**: The "Knowledge Graph" is entirely external. No control over the retrieval index or raw data for French/EU law.
- **Scalability**: The current vector search is O(N) in Javascript, suitable only for small documents, not a full legal corpus.

---

## 2. Project Vision & Goals (from Documentation)

The goal is to build a **sovereign, verifiable legal AI** for French and EU law, replicating features of premium tools (like Lexis+ AI) using open data.

### Core Objectives
1.  **Trust & Verifiability**: Every sentence must be grounded in a cited official source (Pinpoint citations).
2.  **Scope**: France (Légifrance, Judilibre, JORF) + EU (EUR-Lex, CJEU) + ECHR (HUDOC).
3.  **Data Sovereignty**: Shift from "wrapping an API" (current state) to **owning the index** (Postgres + OpenSearch/Vector DB).
4.  **Privacy**: Zero-retention policy for user uploads.

### Planned Architecture (Target: "Smart Orchestrator")
- **Ingestion (Public Law)**: Delegated to **Perplexity API** (Verified by internal guardrails).
- **Ingestion (User Files)**: Upload -> Parse -> **PostgreSQL (pgvector)**.
- **Orchestrator**: Next.js App Router handling the "Hybrid" logic (merging API results with local file context).
- **Storage**:
    - **PostgreSQL**: User accounts, Chat history, User file embeddings.
    - **S3**: Storage of original user PDF files.
- **Model**: Perplexity (`sonar-pro`) for research; GPT-4/Claude for drafting/synthesis if needed.

---

## 3. Implementation Plan & Recommendations

Below is the roadmap to bridge the gap between the current Prototype and the Target Architecture.

### Features to Implement & Recommended Services

| Feature Area | Current Status | Target Implementation | Recommended Service/Stack |
| :--- | :--- | :--- | :--- |
| **Public Law Search** | Implemented (Perplexity) | **Enhanced Perplexity Integration** with better system prompts & post-verification. | **Perplexity API** (Keep current). |
| **User File Search** | In-Memory (JS) | Persistent vector search for user uploads. | **PostgreSQL + pgvector**. |
| **Hybrid Search** | N/A | Orchestrator to blend "Public Law" (API) + "My Files" (Vector DB). | **LangChain** (for logic flow). |
| **Database** | N/A | Persistent storage for User Data & File Embeddings. | **PostgreSQL** (Supabase/Neon/AWS RDS). |
| **User Auth** | N/A | Secure login, session management. | **Auth0**, **Clerk**, or **Supabase Auth**. |
| **File Storage** | N/A | Persisting uploaded PDFs. | **AWS S3** or **Supabase Storage**. |
| **Alerts** | Frontend Only | Lightweight job checking specific API endpoints (not full ingestion). | **Dagster** or Simple Cron. |

### Immediate Next Steps (Priority)

1.  **Database & Auth Setup**:
    *   Initialize PostgreSQL (with `pgvector` extension).
    *   Implement User Authentication (Clerk or Supabase).
    *   Create tables: `users`, `chats`, `files`, `file_embeddings`.

2.  **Persist User Uploads**:
    *   Refactor `/api/upload`: Save parsed chunks to Postgres/pgvector instead of in-memory Map.
    *   Refactor `/api/ask-doc`: Query Postgres for relevant chunks.

3.  **Implement Hybrid Mode**:
    *   Update UI to allow selecting "Scope": `Public Law`, `My Files`, or `Hybrid`.
    *   **Logic**:
        *   If `My Files`: Vector Search -> LLM Context.
        *   If `Public Law`: Perplexity API.
        *   If `Hybrid`: Vector Search -> Inject Chunks into Perplexity Prompt as "User Context".

### Feature Summary Checklist

*   [x] **Conversational Interface** (UI implemented)
*   [x] **Perplexity Integration** (Public Law Search)
*   [x] **Document Upload Parsing** (PDF -> Text)
*   [x] **Basic Drafting Templates**
*   [ ] **PostgreSQL + pgvector** (For User Files ONLY)
*   [ ] **User Authentication**
*   [ ] **Persisted Chat History**
*   [ ] **Hybrid Search Router** (API + User Files)
*   [ ] **Alerts Backend**
