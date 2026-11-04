import { BadRequestException } from '@nestjs/common';

const ADDRESS = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.zz$/;
export function normalizeAddress(input: string): string {
  const value = input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!ADDRESS.test(value)) throw new BadRequestException('Enter a fictional address such as nature.zz.');
  return value;
}

export function readableText(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style|template|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;|&#34;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, ' ').trim();
}
