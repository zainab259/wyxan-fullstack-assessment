import type { BrowserSession, NavigationEntry, PageState } from '../types';
export const emptySession = (): BrowserSession => ({ entries: [], position: -1 });
export function pushEntry(session: BrowserSession, address: string, page: PageState): BrowserSession {
  const current = session.entries[session.position];
  if (current && current.address === address && current.page.kind === page.kind && ((page.kind === 'site' && current.page.kind === 'site' && current.page.site._id === page.site._id) || (page.kind === 'search' && current.page.kind === 'search' && current.page.query === page.query))) return session;
  const entry: NavigationEntry = { id: `${Date.now()}-${Math.random()}`, address, page, enteredAt: new Date().toISOString() };
  return { entries: [...session.entries.slice(0, session.position + 1), entry], position: session.position + 1 };
}
export function move(session: BrowserSession, delta: -1 | 1): BrowserSession {
  const next = session.position + delta;
  return next >= 0 && next < session.entries.length ? { ...session, position: next } : session;
}
