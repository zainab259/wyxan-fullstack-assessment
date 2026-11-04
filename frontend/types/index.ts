export interface Person { id: string; name: string }
export interface Site { _id: string; address: string; title: string; html: string; authorId: Person | string; createdAt: string; updatedAt: string }
export interface SearchResult { address: string; title: string; snippet: string; author?: Person }
export type NavigationMethod = 'typed' | 'link' | 'back' | 'forward' | 'history' | 'search' | 'publish';
export interface Visit { _id: string; userId: string; address: string; method: NavigationMethod; visitedAt: string; title?: string }
export type PageState = { kind: 'site'; site: Site } | { kind: 'search'; query: string; results: SearchResult[] } | { kind: 'missing'; address: string };
export interface NavigationEntry { id: string; address: string; page: PageState; enteredAt: string }
export interface BrowserSession { entries: NavigationEntry[]; position: number }
