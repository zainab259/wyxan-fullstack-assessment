import { emptySession, move, NavigationGate, pushEntry, replaceUserSession } from './navigation';
import type { PageState } from '../types';
const page = (address: string): PageState => ({ kind: 'site', site: { _id: address, address, title: address, html: '', authorId: '', createdAt: '', updatedAt: '' } });
describe('browser navigation', () => {
  it('allows only the latest request for the selected reader to commit', () => {
    const gate = new NavigationGate();
    const slowRequest = gate.begin('avery');
    const fastRequest = gate.begin('avery');
    expect(gate.isCurrent(fastRequest, 'avery')).toBe(true);
    expect(gate.isCurrent(slowRequest, 'avery')).toBe(false);
    expect(gate.isCurrent(fastRequest, 'mina')).toBe(false);
  });
  it('invalidates pending requests immediately when a reader changes or history moves', () => {
    const gate = new NavigationGate();
    const pending = gate.begin('avery');
    gate.cancel();
    expect(gate.isCurrent(pending, 'avery')).toBe(false);
    const next = gate.begin('mina');
    expect(gate.isCurrent(next, 'mina')).toBe(true);
  });

  it('moves backward and forward across a trail and discards the forward branch', () => {
    let state = emptySession();
    for (const address of ['a.zz', 'b.zz', 'c.zz', 'd.zz']) state = pushEntry(state, address, page(address));
    state = move(move(state, -1), -1);
    expect(state.entries[state.position]?.address).toBe('b.zz');
    state = move(state, 1);
    expect(state.entries[state.position]?.address).toBe('c.zz');
    state = pushEntry(state, 'e.zz', page('e.zz'));
    expect(state.entries.map((entry) => entry.address)).toEqual(['a.zz', 'b.zz', 'c.zz', 'e.zz']);
    expect(move(state, 1)).toBe(state);
  });
  it('keeps the original page snapshot when a site changes later', () => {
    let state = pushEntry(emptySession(), 'a.zz', page('a.zz'));
    state = pushEntry(state, 'b.zz', page('b.zz'));
    const oldPage = state.entries[0]?.page;
    state = move(state, -1);
    expect(state.entries[state.position]?.page).toBe(oldPage);
  });
  it('returns from a result page to the same captured search results', () => {
    const results = [{ address: 'nature.zz', title: 'Coast', snippet: 'A tide pool', author: { id: '1', name: 'Avery' } }];
    let state = pushEntry(emptySession(), 'search://tide', { kind: 'search', query: 'tide', results });
    state = pushEntry(state, 'nature.zz', page('nature.zz'));
    state = move(state, -1);
    expect(state.entries[state.position]?.page).toEqual({ kind: 'search', query: 'tide', results });
  });
  it('does not duplicate a repeated identical current-page navigation', () => {
    const snapshot = page('nature.zz');
    let state = pushEntry(emptySession(), 'nature.zz', snapshot);
    const first = state.entries[0];
    state = pushEntry(state, 'nature.zz', snapshot);
    expect(state.entries).toHaveLength(1);
    expect(state.entries[0]).toBe(first);
  });
  it('keeps a refreshed version of a site as a new navigation snapshot', () => {
    const old: PageState = { kind: 'site', site: { _id: '1', address: 'nature.zz', title: 'Nature', html: '<p>old</p>', authorId: '', createdAt: '', updatedAt: '' } };
    const refreshed: PageState = { kind: 'site', site: { _id: '1', address: 'nature.zz', title: 'Nature', html: '<p>updated</p>', authorId: '', createdAt: '', updatedAt: '' } };
    let state = pushEntry(emptySession(), 'nature.zz', old);
    state = pushEntry(state, 'nature.zz', refreshed);
    expect(state.entries).toHaveLength(2);
    state = move(state, -1);
    expect(state.entries[state.position]?.page).toBe(old);
    const restored = state.entries[state.position]?.page;
    expect(restored?.kind).toBe('site');
    if (restored?.kind === 'site') expect(restored.site.html).toBe('<p>old</p>');
    expect(state.entries[1]?.page).toBe(refreshed);
  });
  it('keeps each selected person’s navigation stack separate', () => {
    const avery = pushEntry(emptySession(), 'nature.zz', page('nature.zz'));
    const mina = pushEntry(emptySession(), 'science.zz', page('science.zz'));
    const sessions = replaceUserSession(replaceUserSession({}, 'avery-id', avery), 'mina-id', mina);
    expect(sessions['avery-id']?.entries[0]?.address).toBe('nature.zz');
    expect(sessions['mina-id']?.entries[0]?.address).toBe('science.zz');
  });
  it('keeps a missing page in the active trail and lets Back restore the prior site', () => {
    let state = pushEntry(emptySession(), 'nature.zz', page('nature.zz'));
    state = pushEntry(state, 'nowhere.zz', { kind: 'missing', address: 'nowhere.zz' });
    expect(state.entries[state.position]?.page.kind).toBe('missing');
    state = move(state, -1);
    expect(state.entries[state.position]?.address).toBe('nature.zz');
  });
});
