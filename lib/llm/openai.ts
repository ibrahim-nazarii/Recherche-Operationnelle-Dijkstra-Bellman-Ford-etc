import OpenAI from 'openai';

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embed(texts: string[]) {
  const { data } = await openai.embeddings.create({ model: 'text-embedding-3-large', input: texts });
  return data.map(d => d.embedding as number[]);
}
