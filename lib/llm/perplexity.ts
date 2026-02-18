type PerplexityOptions = {
  model?: string;
  temperature?: number;
  returnCitations?: boolean;
};

const DEFAULT_MODEL = process.env.PERPLEXITY_MODEL ?? "sonar-deep-search";
const DEFAULT_TEMPERATURE = 0.2;

export async function askPerplexity(
  query: string,
  systemHint: string,
  options: PerplexityOptions = {}
) {
  const model = options.model ?? DEFAULT_MODEL;
  const temperature = options.temperature ?? DEFAULT_TEMPERATURE;
  const returnCitations = options.returnCitations ?? true;
  const r = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY ?? ''}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      return_citations: returnCitations,
      messages: [
        { role: 'system', content: systemHint },
        { role: 'user', content: query }
      ]
    })
  });
  if (!r.ok) throw new Error(`Perplexity error ${r.status}`);
  const data = await r.json();
  const text: string = data.choices?.[0]?.message?.content ?? '';
  const citations: string[] = data.choices?.[0]?.message?.citations
    ?? data?.citations ?? [];
  return { text, citations } as { text: string; citations: string[] };
}
