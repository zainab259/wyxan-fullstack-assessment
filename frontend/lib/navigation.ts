import type { BrowserSession, NavigationEntry, PageState } from '../types';
export type BrowserSessions = Record<string, BrowserSession>;
export const emptySession = (): BrowserSession => ({ entries: [], position: -1 });
export function replaceUserSession(sessions: BrowserSessions, userId: string, session: BrowserSession): BrowserSessions {
  return { ...sessions, [userId]: session };
}
export function pushEntry(session: BrowserSession, address: string, page: PageState): BrowserSession {
  const current = session.entries[session.position];
  if (current && current.address === address && current.page === page) return session;
  const entry: NavigationEntry = { id: `${Date.now()}-${Math.random()}`, address, page, enteredAt: new Date().toISOString() };
  return { entries: [...session.entries.slice(0, session.position + 1), entry], position: session.position + 1 };
}
export function move(session: BrowserSession, delta: -1 | 1): BrowserSession {
  const next = session.position + delta;
  return next >= 0 && next < session.entries.length ? { ...session, position: next } : session;
}
