import { BadRequestException } from '@nestjs/common';
import { normalizeAddress, readableText } from './address';

describe('small web addresses and readable prose', () => {
  it('normalizes a fictional hostname and accepts its URL form', () => {
    expect(normalizeAddress(' HTTPS://Nature.ZZ/ ')).toBe('nature.zz');
  });
  it('rejects real or malformed hosts', () => {
    expect(() => normalizeAddress('https://example.com')).toThrow(BadRequestException);
    expect(() => normalizeAddress('javascript:alert(1)')).toThrow(BadRequestException);
  });
  it('extracts prose without indexing markup, scripts, or styles', () => {
    expect(readableText('<h1>Coast</h1><p>Blue tide pools</p><script>hidden()</script><style>.x{}</style>')).toBe('Coast Blue tide pools');
  });
});
