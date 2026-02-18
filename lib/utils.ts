import { cookies } from 'next/headers';
import type { SessionIndex } from '@/lib/types';

// simple in-memory store (demo only)
const store = new Map<string, SessionIndex>();

export function getSidFromCookies(): string | undefined {
  // `cookies()` only works in server components/route handlers
  try {
    const c = cookies();
    return c.get('sid')?.value;
  } catch { return undefined; }
}

export function getSessionIndex(): SessionIndex | undefined {
  const sid = getSidFromCookies();
  if (!sid) return undefined;
  return store.get(sid);
}

export function setSessionIndex(idx: SessionIndex) {
  const sid = getSidFromCookies();
  if (!sid) throw new Error('no sid');
  store.set(sid, idx);
}
