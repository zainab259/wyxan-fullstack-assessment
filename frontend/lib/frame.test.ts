import { createSandboxDocument } from './frame';
import type { Site } from '../types';
const makeSite = (html: string): Site => ({ _id: '1', address: 'sample.zz', title: 'Sample', html, authorId: '', createdAt: '', updatedAt: '' });
describe('published page isolation document', () => {
  it('sets a restrictive CSP with a per-document bridge nonce', () => {
    const doc = createSandboxDocument(makeSite('<h1>Hello</h1>'), 'random-nonce');
    expect(doc).toContain("default-src 'none'");
    expect(doc).toContain("script-src 'nonce-random-nonce'");
    expect(doc).toContain('<script nonce="random-nonce">');
    expect(doc).toContain("connect-src 'none'");
  });
  it('does not grant author scripts a nonce and only bridges fictional links', () => {
    const html = `<script>alert(document.cookie)</script><img src="https://example.com/pixel" onerror="alert(1)"><a href="javascript:alert(1)">external</a><a href="nature.zz">internal</a><meta http-equiv="refresh" content="0;url=https://example.com">`;
    const doc = createSandboxDocument(makeSite(html), 'private-token');
    expect(doc).not.toContain('alert(document.cookie)');
    expect(doc).toContain('parent.postMessage');
    expect(doc).toContain("img-src 'none'");
    expect(doc).toContain("script-src-attr 'none'");
    expect(doc).not.toContain('http-equiv="refresh"');
    expect(doc).toContain("navigate-to 'none'");
  });
});
