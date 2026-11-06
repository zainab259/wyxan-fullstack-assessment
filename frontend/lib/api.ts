import type { Person, SearchResult, Site, Visit, NavigationMethod } from '../types';
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';
export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(`${API}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } }); }
  catch { throw new Error('The backend could not be reached. Check that the API is running.'); }
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data === 'object' && data !== null && 'message' in data ? (data as { message: unknown }).message : 'The request failed.';
    throw new ApiError(Array.isArray(message) ? message.join(' ') : String(message), response.status);
  }
  return data as T;
}
export const api = {
  users: () => request<Person[]>('/users'),
  site: (address: string) => request<Site>(`/sites/${encodeURIComponent(address)}`),
  search: (query: string) => request<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`),
  visits: (userId: string) => request<Visit[]>(`/visits?userId=${encodeURIComponent(userId)}`),
  recordVisit: (data: { userId: string; address: string; method: NavigationMethod; title: string }) => request<Visit>('/visits', { method: 'POST', body: JSON.stringify(data) }),
  publish: (data: { address: string; title: string; html: string; authorId: string }) => request<Site>('/sites', { method: 'POST', body: JSON.stringify(data) }),
};
