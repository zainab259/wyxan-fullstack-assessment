import type { Site } from '../types';
export function createSandboxDocument(site: Site, nonce: string): string {
  const policy = `default-src 'none'; script-src 'nonce-${nonce}'; script-src-attr 'none'; style-src 'unsafe-inline'; img-src 'none'; font-src 'none'; media-src 'none'; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; navigate-to 'none'`;
  const bridge = `(function(){document.addEventListener('click',function(e){var a=e.target instanceof Element?e.target.closest('a'):null;if(!a)return;e.preventDefault();var raw=a.getAttribute('href')||'';if(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.zz$/i.test(raw.trim()))parent.postMessage({type:'small-web-link',address:raw.trim()},'*')},true);document.addEventListener('submit',function(e){e.preventDefault()},true)})()`;
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="referrer" content="no-referrer">`;
  const safeHtml = site.html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<\/?script\b[^>]*>/gi, '')
    .replace(/<meta\b(?=[^>]*\bhttp-equiv\s*=\s*["']?refresh\b)[^>]*>/gi, '');
  const document = `<!doctype html><html><head>${meta}<meta charset="utf-8"></head><body>${safeHtml}</body></html>`;
  return `${document}<script nonce="${nonce}">${bridge}</script>`;
}
