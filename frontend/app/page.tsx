'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { createSandboxDocument } from '@/lib/frame';
import { emptySession, move, pushEntry } from '@/lib/navigation';
import type { BrowserSession, NavigationMethod, PageState, Person, SearchResult, Site, Visit } from '@/types';

type SessionMap = Record<string, BrowserSession>;
const validAddress = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.zz$/i;
function normalizedInput(input: string): string {
  return input.trim().toLowerCase().replace(/^https?:\/\//, '').split(/[/?#]/)[0] ?? '';
}
function Icon({ children }: { children: React.ReactNode }) { return <span aria-hidden="true" className="inline-flex h-5 w-5 items-center justify-center text-lg leading-none">{children}</span>; }

export default function Home() {
  const [people, setPeople] = useState<Person[]>([]);
  const [userId, setUserId] = useState('');
  const [sessions, setSessions] = useState<SessionMap>({});
  const [address, setAddress] = useState('nature.zz');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [panel, setPanel] = useState<'history' | 'search' | 'publish'>('history');
  const [query, setQuery] = useState('');
  const [nonce, setNonce] = useState('');
  const [publishForm, setPublishForm] = useState({ address: '', title: '', html: '' });
  const [publishing, setPublishing] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const currentSession = sessions[userId] ?? emptySession();
  const entry = currentSession.entries[currentSession.position];
  const currentPage = entry?.page;

  useEffect(() => {
    const bytes = new Uint8Array(18); window.crypto.getRandomValues(bytes);
    setNonce(Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(''));
    try { const stored = localStorage.getItem('small-web-sessions'); if (stored) setSessions(JSON.parse(stored) as SessionMap); } catch { localStorage.removeItem('small-web-sessions'); }
    void api.users().then((rows) => {
      setPeople(rows);
      const saved = localStorage.getItem('small-web-user');
      setUserId(saved && rows.some((person) => person.id === saved) ? saved : rows[0]?.id ?? '');
    }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Could not load users.'));
  }, []);

  useEffect(() => {
    if (!userId) return;
    localStorage.setItem('small-web-user', userId);
    setHistoryLoading(true);
    void api.visits(userId).then(setVisits).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Could not load history.')).finally(() => setHistoryLoading(false));
  }, [userId]);

  useEffect(() => {
    setAddress(entry?.address ?? '');
  }, [userId, currentSession.position, entry?.address]);

  useEffect(() => { try { localStorage.setItem('small-web-sessions', JSON.stringify(sessions)); } catch { /* Session snapshots are an in-memory enhancement if storage is unavailable. */ } }, [sessions]);

  const record = useCallback(async (site: Site, method: NavigationMethod) => {
    if (!userId) return;
    try { const visit = await api.recordVisit({ userId, address: site.address, title: site.title, method }); setVisits((previous) => [visit, ...previous]); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not record this visit.'); }
  }, [userId]);

  const commitPage = useCallback((page: PageState, dest: string, method: NavigationMethod) => {
    setSessions((previous) => ({ ...previous, [userId]: pushEntry(previous[userId] ?? emptySession(), dest, page) }));
    setAddress(dest);
    setError('');
    if (page.kind === 'site') void record(page.site, method);
  }, [record, userId]);

  const navigate = useCallback(async (raw: string, method: NavigationMethod) => {
    if (!userId) return;
    const dest = normalizedInput(raw);
    setAddress(raw.trim()); setLoading(true); setError('');
    if (!validAddress.test(dest)) {
      commitPage({ kind: 'missing', address: dest || raw.trim() || 'unknown address' }, dest || raw.trim(), method);
      setLoading(false); return;
    }
    try { const site = await api.site(dest); commitPage({ kind: 'site', site }, site.address, method); }
    catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not load the site.';
      commitPage({ kind: 'missing', address: dest }, dest, method);
      setError(message.toLowerCase().includes('no site exists') ? '' : message);
    } finally { setLoading(false); }
  }, [commitPage, userId]);

  const goToHistory = (visit: Visit) => { setPanel('history'); void navigate(visit.address, 'history'); };
  const onGo = (event: FormEvent) => { event.preventDefault(); void navigate(address, 'typed'); };
  const onSearch = async (event: FormEvent) => {
    event.preventDefault(); const value = query.trim(); if (!value) { setError('Enter a word or phrase to search.'); return; }
    setLoading(true); setError('');
    try { const results = await api.search(value); const page: PageState = { kind: 'search', query: value, results }; commitPage(page, `search://${encodeURIComponent(value)}`, 'search'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Search failed.'); }
    finally { setLoading(false); }
  };
  const onPublish = async (event: FormEvent) => {
    event.preventDefault(); setPublishing(true); setError('');
    try { const site = await api.publish({ ...publishForm, authorId: userId }); setPublishForm({ address: '', title: '', html: '' }); setPanel('history'); await navigate(site.address, 'publish'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Publishing failed.'); }
    finally { setPublishing(false); }
  };

  useEffect(() => {
    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.source !== frameRef.current?.contentWindow || typeof event.data !== 'object' || event.data === null) return;
      const payload = event.data as { type?: unknown; address?: unknown };
      if (payload.type === 'small-web-link' && typeof payload.address === 'string' && validAddress.test(payload.address)) void navigate(payload.address, 'link');
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [navigate]);

  const goBack = () => {
    const moved = move(currentSession, -1); const page = moved.entries[moved.position]?.page;
    setSessions((previous) => ({ ...previous, [userId]: moved })); setAddress(moved.entries[moved.position]?.address ?? '');
    if (page?.kind === 'site') void record(page.site, 'back');
  };
  const goForward = () => {
    const moved = move(currentSession, 1); const page = moved.entries[moved.position]?.page;
    setSessions((previous) => ({ ...previous, [userId]: moved })); setAddress(moved.entries[moved.position]?.address ?? '');
    if (page?.kind === 'site') void record(page.site, 'forward');
  };

  const sandboxDoc = useMemo(() => currentPage?.kind === 'site' && nonce ? createSandboxDocument(currentPage.site, nonce) : '', [currentPage, nonce]);
  const displayName = people.find((person) => person.id === userId)?.name ?? 'Choose a reader';

  return <main className="min-h-screen px-4 py-5 sm:px-8 sm:py-8">
    <header className="mx-auto mb-6 flex max-w-[1440px] flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-xl text-white">w.</div><div><p className="text-xs font-bold uppercase tracking-[.22em] text-moss">A little corner of the internet</p><h1 className="text-xl font-bold tracking-tight">The Small Web</h1></div></div>
      <label className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-2.5 shadow-sm"><span className="text-sm text-slate-500">Browsing as</span><select aria-label="Choose browsing user" className="max-w-40 bg-transparent font-semibold text-ink" value={userId} onChange={(event) => setUserId(event.target.value)}>{people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
    </header>

    <section className="mx-auto max-w-[1440px] overflow-hidden rounded-[26px] border border-line bg-white shadow-soft">
      <div className="flex items-center gap-2 border-b border-line bg-[#fbfcfa] px-4 py-3 sm:px-6">
        <button aria-label="Go back" title="Back" disabled={currentSession.position <= 0} onClick={goBack} className="rounded-xl p-2 text-ink transition hover:bg-sand disabled:cursor-not-allowed disabled:opacity-30"><Icon>←</Icon></button>
        <button aria-label="Go forward" title="Forward" disabled={currentSession.position >= currentSession.entries.length - 1} onClick={goForward} className="rounded-xl p-2 text-ink transition hover:bg-sand disabled:cursor-not-allowed disabled:opacity-30"><Icon>→</Icon></button>
        <form onSubmit={onGo} className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-white px-3 py-1.5 focus-within:border-moss"><span className="text-xs text-moss">●</span><input aria-label="Fictional website address" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="try nature.zz" className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-slate-400"/><button className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss">Go</button></form>
      </div>

      {error && <div role="alert" className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      <div className="grid min-h-[690px] lg:grid-cols-[minmax(0,1fr)_330px]">
        <section aria-label="Website viewer" className="min-w-0 border-b border-line lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-line-soft px-6 py-3"><div className="flex items-center gap-2 text-xs font-medium text-slate-500"><span className="h-2 w-2 rounded-full bg-[#e8b75b]"/><span className="h-2 w-2 rounded-full bg-[#78b982]"/><span className="ml-2">{currentPage?.kind === 'site' ? currentPage.site.address : currentPage?.kind === 'search' ? 'Search results' : 'The Small Web'}</span></div><span className="text-xs text-slate-400">{displayName}&apos;s browser</span></div>
          <div className="min-h-[640px] bg-[#f8f9f6] p-4 sm:p-7">
            {loading && <div className="mb-3 flex items-center gap-2 text-sm text-moss" role="status"><span className="h-2 w-2 animate-pulse rounded-full bg-moss"/>Loading your page…</div>}
            {!currentPage && !loading && <Welcome onVisit={(dest) => void navigate(dest, 'typed')}/>}
            {currentPage?.kind === 'site' && <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-line bg-white shadow-sm"><div className="border-b border-line-soft px-5 py-3"><h2 className="font-semibold">{currentPage.site.title}</h2><p className="mt-0.5 text-xs text-slate-500">Published by {typeof currentPage.site.authorId === 'object' ? currentPage.site.authorId.name : 'a community author'}</p></div><iframe ref={frameRef} title={`Published page: ${currentPage.site.title}`} sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={sandboxDoc} className="h-[580px] w-full border-0 bg-white"/></div>}
            {currentPage?.kind === 'missing' && <div className="mx-auto mt-20 max-w-lg text-center"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#e9eee7] text-2xl">⌕</div><p className="text-xs font-bold uppercase tracking-[.2em] text-moss">Address not found</p><h2 className="mt-3 text-2xl font-bold">This little place is missing.</h2><p className="mt-3 text-slate-600">There isn&apos;t a page at <code className="rounded bg-sand px-1.5 py-0.5 text-sm">{currentPage.address || 'that address'}</code>. Check the address or wander somewhere else.</p><button onClick={() => void navigate('nature.zz', 'typed')} className="mt-6 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-moss">Visit the coast</button></div>}
            {currentPage?.kind === 'search' && <SearchResults query={currentPage.query} results={currentPage.results} onSelect={(dest) => void navigate(dest, 'search')}/>}
          </div>
        </section>

        <aside className="flex min-h-[650px] flex-col bg-[#fcfdfa]">
          <div className="grid grid-cols-3 border-b border-line p-2">{(['history','search','publish'] as const).map((id) => <button key={id} onClick={() => { setPanel(id); setError(''); }} className={`rounded-lg px-2 py-2.5 text-xs font-semibold capitalize ${panel === id ? 'bg-ink text-white' : 'text-slate-600 hover:bg-sand'}`}>{id === 'history' ? 'History' : id === 'search' ? 'Search' : 'Publish'}</button>)}</div>
          {panel === 'history' && <div className="flex min-h-0 flex-1 flex-col"><div className="border-b border-line-soft px-5 py-4"><div className="flex items-center justify-between"><h2 className="font-bold">Your trail</h2><span className="rounded-full bg-sand px-2.5 py-1 text-xs text-slate-600">{visits.length} visits</span></div><p className="mt-1 text-xs text-slate-500">A personal record for {displayName}</p></div><div className="max-h-[570px] flex-1 overflow-y-auto px-3 py-2" aria-label="Browsing history">{historyLoading ? <p className="px-3 py-6 text-sm text-slate-500">Loading history…</p> : visits.length === 0 ? <p className="px-3 py-8 text-center text-sm text-slate-500">Your visits will appear here.</p> : visits.map((visit) => <button key={visit._id} onClick={() => goToHistory(visit)} className="group flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left hover:bg-sand"><span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e9eee7] text-sm text-moss">↗</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-ink">{visit.title ?? visit.address}</span><span className="mt-0.5 flex items-center justify-between gap-2 text-xs text-slate-500"><span className="truncate">{visit.address}</span><time className="shrink-0">{new Date(visit.visitedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></span></span></button>)}</div></div>}
          {panel === 'search' && <div className="p-5"><h2 className="font-bold">Find in the small web</h2><p className="mt-1 text-xs leading-5 text-slate-500">Search titles and the words written on every page.</p><form onSubmit={onSearch} className="mt-4 flex gap-2"><input aria-label="Search website content" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. tide pools" className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-2.5 text-sm"/><button className="rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:bg-moss">Find</button></form><p className="mt-4 text-xs text-slate-500">Results open in the page area. Use Back to return to these results.</p></div>}
          {panel === 'publish' && <form onSubmit={onPublish} className="space-y-3 p-5"><div><h2 className="font-bold">Add a little place</h2><p className="mt-1 text-xs leading-5 text-slate-500">Pages are shared with every reader. Your name will be shown as the author.</p></div><label className="block text-xs font-semibold text-slate-600">Address<input required pattern="[a-zA-Z0-9][a-zA-Z0-9-]*\.zz" maxLength={80} value={publishForm.address} onChange={(event) => setPublishForm({ ...publishForm, address: event.target.value })} placeholder="garden.zz" className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-normal"/></label><label className="block text-xs font-semibold text-slate-600">Page title<input required maxLength={120} value={publishForm.title} onChange={(event) => setPublishForm({ ...publishForm, title: event.target.value })} placeholder="A small garden" className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-normal"/></label><label className="block text-xs font-semibold text-slate-600">HTML content<textarea required maxLength={40000} rows={11} value={publishForm.html} onChange={(event) => setPublishForm({ ...publishForm, html: event.target.value })} placeholder={'<h1>Hello, small web</h1>\n<p>Write something worth finding.</p>'} className="mt-1.5 w-full resize-y rounded-xl border border-line bg-white px-3 py-2.5 font-mono text-xs font-normal leading-5"/></label><p className="text-[11px] leading-4 text-slate-500">Published HTML runs in a sandbox. Scripts, images, and outside network requests are blocked.</p><button disabled={publishing} className="w-full rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white hover:bg-moss disabled:opacity-50">{publishing ? 'Publishing…' : 'Publish page'}</button></form>}
        </aside>
      </div>
    </section>
    <footer className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 px-2 pt-4 text-xs text-slate-500"><span>A small collection of pages, made by people.</span><span>Nothing here leaves the small web.</span></footer>
  </main>;
}

function Welcome({ onVisit }: { onVisit: (address: string) => void }) {
  const suggestions = [{ address: 'nature.zz', label: 'Field notes', color: 'bg-[#e7efe3]' }, { address: 'science.zz', label: 'Small experiments', color: 'bg-[#e5edf3]' }, { address: 'travel.zz', label: 'Take a walk', color: 'bg-[#f4e9d8]' }];
  return <div className="mx-auto max-w-3xl py-12 sm:py-20"><p className="text-xs font-bold uppercase tracking-[.22em] text-moss">A web small enough to wander</p><h2 className="mt-4 max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">A few good pages.<br/><span className="font-normal text-moss">A little room to explore.</span></h2><p className="mt-5 max-w-xl text-base leading-7 text-slate-600">Every address belongs to a page written by someone. Follow a link, search for an idea, or find your own way in.</p><div className="mt-10 grid gap-3 sm:grid-cols-3">{suggestions.map((item) => <button key={item.address} onClick={() => onVisit(item.address)} className="rounded-2xl border border-line bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm"><span className={`mb-4 flex h-28 items-end rounded-xl ${item.color} p-4 text-2xl font-bold text-ink/70`}>↗</span><span className="block font-semibold">{item.label}</span><span className="mt-1 block text-xs text-slate-500">{item.address}</span></button>)}</div><p className="mt-8 text-xs text-slate-500">Start with the address bar above, or use one of these paths.</p></div>;
}

function SearchResults({ query, results, onSelect }: { query: string; results: SearchResult[]; onSelect: (address: string) => void }) {
  return <div className="mx-auto max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-moss">Small Web Search</p><h2 className="mt-2 text-3xl font-bold">Pages about “{query}”</h2><p className="mt-2 text-sm text-slate-500">{results.length} {results.length === 1 ? 'page' : 'pages'} found in titles and page text</p>{results.length === 0 ? <div className="mt-10 rounded-2xl border border-dashed border-line bg-white p-8 text-center"><p className="font-semibold">No pages found this time.</p><p className="mt-2 text-sm text-slate-500">Try a different word or phrase.</p></div> : <div className="mt-6 space-y-3">{results.map((result) => <button key={result.address} onClick={() => onSelect(result.address)} className="block w-full rounded-2xl border border-line bg-white p-5 text-left hover:border-moss hover:shadow-sm"><span className="text-xs font-medium text-moss">{result.address}</span><span className="mt-1 block text-lg font-bold text-ink">{result.title}</span><span className="mt-2 block text-sm leading-6 text-slate-600">{result.snippet}</span></button>)}</div>}</div>;
}
