import type { Source } from '@/lib/types';

/**
 * Attaches structured Source objects to the answer.
 * Optionally rewrites [n] markers in the text if a mapping (oldIndex -> newIndex) is provided.
 */
export function attachMarkers(
  answer: string, 
  officialUrls: string[], 
  mapping?: Map<number, number>
): { text: string; sources: Source[] } {
  
  // 1. Create structured sources for the official URLs
  const sources: Source[] = officialUrls.map((url, i) => ({ 
    id: String(i+1), 
    url, 
    pinpoint: 'n/a' 
  }));

  let text = answer ?? '';

  // 2. Rewrite markers if mapping is provided
  if (mapping) {
    // We replace [1], [2], etc.
    // Note: We should probably process in a way that doesn't conflict (e.g. if [3]->[2] and we have [2]->[1])
    // But since we are mapping old indices (unique) to new indices, we can do it in one pass if we are careful.
    // The regex finds all [d+].
    text = text.replace(/\[(\d+)\]/g, (match, digits) => {
      const oldId = parseInt(digits, 10);
      const newId = mapping.get(oldId);
      return newId ? `[${newId}]` : ''; // Remove if filtered
    });
  }

  // 3. If no markers exist (or they were all removed), append the sources list
  const hasMarkers = /\[(\d+)\]/.test(text);
  if (!hasMarkers && sources.length > 0) {
    const refs = sources.map(s=>`[${s.id}]`).join(' ');
    text = `${text}\n\nSources: ${refs}`;
  }

  return { text, sources };
}
