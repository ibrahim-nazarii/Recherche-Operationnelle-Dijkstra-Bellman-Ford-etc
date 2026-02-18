export type Source = {
  id: string;
  title?: string;
  url: string;
  jurisdiction?: 'FR'|'EU'|'ECHR'|'CJEU'|'OTHER';
  date?: string;
  pinpoint?: string; // '§ 42' | 'p. 3' | 'n/a'
  quote?: string;
};

export type QAResponse = {
  answer: string;
  sources: Source[];
  guardrail_notes?: string[];
};

export type Chunk = {
  id: string;
  page?: number;
  text: string;
  embedding?: number[];
};

export type SessionIndex = {
  chunks: Chunk[];
  dim: number;
};
