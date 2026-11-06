const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const chrome = process.env.CHROME_PATH || [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error('Install Chrome or Edge, or set CHROME_PATH to its executable.');

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'small-web-browser-'));
const browser = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--no-sandbox', '--disable-dev-shm-usage', '--remote-debugging-port=0',
  `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore', windowsHide: true });

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function eventually(check, description, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await check();
    if (value) return value;
    await pause(100);
  }
  throw new Error(`Timed out waiting for ${description}`);
}

async function main() {
  const activePortFile = path.join(profile, 'DevToolsActivePort');
  await eventually(() => fs.existsSync(activePortFile), 'Chrome DevTools');
  const port = Number(fs.readFileSync(activePortFile, 'utf8').split(/\r?\n/)[0]);
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target = targets.find((item) => item.type === 'page');
  assert.ok(target, 'Chrome should expose a page target');

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  const listeners = new Map();
  let commandId = 0;
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = pending.get(message.id);
      if (request) {
        pending.delete(message.id);
        message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result);
      }
    } else {
      for (const listener of listeners.get(message.method) ?? []) listener(message.params);
    }
  });
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++commandId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const on = (method, listener) => {
    const group = listeners.get(method) ?? [];
    group.push(listener);
    listeners.set(method, group);
  };
  const evaluate = async (expression, contextId) => {
    const result = await send('Runtime.evaluate', { expression, contextId, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Browser evaluation failed');
    return result.result.value;
  };
  const requests = [];
  on('Network.requestWillBeSent', ({ request }) => requests.push(request.url));

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  const maliciousHtml = '<a href="science.zz">science</a><script>parent.postMessage({type:"small-web-link",address:"owned.zz"},"*")</script><img src="http://127.0.0.1:1/pixel" onerror="alert(1)"><a href="https://example.com">external</a>';
  const mockApi = `(() => {
    window.__MOCK_LOG = [];
    const users = [{id:'reader-a',name:'Avery Stone'},{id:'reader-b',name:'Mina Chen'}];
    const pages = {
      'nature.zz': {title:'Coastal Field Notes', html:${JSON.stringify(maliciousHtml)}},
      'science.zz': {title:'Small Experiments', html:'<h1>Science</h1><a href="books.zz">books</a>'},
      'books.zz': {title:'Reading Room', html:'<h1>Books</h1>'},
      'travel.zz': {title:'Travel Notes', html:'<h1>Travel</h1>'},
      'history.zz': {title:'Harbor History', html:'<h1>History</h1>'},
      'garden.zz': {title:'Published Garden', html:'<h1>A published page</h1><p>Ready for visitors.</p>'},
      'slow.zz': {title:'Slow Response', html:'<h1>Slow</h1>'}
    };
    const json = (data, status=200) => new Response(JSON.stringify(data), {status,headers:{'Content-Type':'application/json'}});
    window.fetch = async (input, init={}) => {
      const url = new URL(typeof input === 'string' ? input : input.url, location.href);
      window.__MOCK_LOG.push(url.toString());
      if (url.pathname.endsWith('/users')) return json(users);
      if (url.pathname.endsWith('/visits') && init.method === 'POST') return json({_id:String(Date.now()), ...JSON.parse(init.body), visitedAt:new Date().toISOString()});
      if (url.pathname.endsWith('/visits')) return json([]);
      if (url.pathname.endsWith('/search')) return json([{address:'nature.zz',title:'Coastal Field Notes',snippet:'Tide pools and small discoveries.',author:{id:'reader-a',name:'Avery Stone'}}]);
      if (url.pathname.endsWith('/sites') && init.method === 'POST') {
        const published = JSON.parse(init.body); pages[published.address] = published;
        return json({_id:'published', ...published, createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
      }
      if (url.pathname.includes('/sites/')) {
        const address = decodeURIComponent(url.pathname.split('/').pop()).toLowerCase();
        if (address === 'slow.zz') await new Promise(resolve => setTimeout(resolve, 900));
        if (address === 'failure.zz') return json({message:'Database unavailable.'}, 503);
        if (!pages[address]) return json({message:'No site exists at this address.'}, 404);
        return json({_id:address,address,...pages[address],authorId:{id:'reader-a',name:'Avery Stone'},createdAt:'2025-01-01T00:00:00.000Z',updatedAt:'2025-01-01T00:00:00.000Z'});
      }
      return json({message:'Unexpected mock API request.'}, 500);
    };
  })()`;
  new Function(mockApi);
  await send('Page.addScriptToEvaluateOnNewDocument', { source: mockApi });
  await send('Page.navigate', { url: 'http://localhost:3000' });
  try {
    await eventually(() => evaluate("document.querySelector('[aria-label=\\\"Choose browsing user\\\"]')?.options.length === 2"), 'reader picker');
  } catch (error) {
    console.error('Browser state at startup:', await evaluate("({url:location.href,title:document.title,body:document.body.innerText.slice(0,1000),mock:window.__MOCK_LOG||null})"));
    throw error;
  }
  const pageMeta = () => evaluate("document.querySelector('.page-meta span.ml-2')?.textContent?.trim()");
  const address = (value) => evaluate(`(() => { const el=document.querySelector('[aria-label="Fictional website address"]'); const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; set.call(el,${JSON.stringify(value)}); el.dispatchEvent(new Event('input',{bubbles:true})); el.form.requestSubmit(); return true; })()`);
  const waitAddress = async (value) => eventually(async () => (await pageMeta()) === value, `page ${value}`);
  const click = (selector) => evaluate(`(() => { const el=document.querySelector(${JSON.stringify(selector)}); if(!el) throw new Error('Missing selector '+${JSON.stringify(selector)}); el.click(); return true; })()`);
  await address('nature.zz');
  await waitAddress('nature.zz');
  await eventually(() => evaluate("document.querySelector('iframe')?.getAttribute('sandbox') === 'allow-scripts'"), 'restricted iframe sandbox');
  await pause(300);
  assert.equal(await evaluate("document.body.dataset.intruded || ''"), '', 'published scripts must not reach the browser interface');
  assert.equal(await pageMeta(), 'nature.zz', 'an author script must not navigate the parent browser');
  assert.equal(await evaluate("document.querySelector('iframe')?.getAttribute('referrerpolicy')"), 'no-referrer');
  assert.ok(!requests.some((url) => /example\\.com|example\\.invalid|127\\.0\\.0\\.1:1/.test(url)), 'external resources must not be requested');
  const iframeRect = await evaluate("(() => { const r=document.querySelector('iframe').getBoundingClientRect(); return {x:r.x,y:r.y}; })()");
  await send('Input.dispatchMouseEvent', {type:'mousePressed',x:iframeRect.x+40,y:iframeRect.y+17,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent', {type:'mouseReleased',x:iframeRect.x+40,y:iframeRect.y+17,button:'left',clickCount:1});
  await waitAddress('science.zz');
  await address('books.zz'); await waitAddress('books.zz');
  await address('travel.zz'); await waitAddress('travel.zz');
  await click('[aria-label="Go back"]'); await waitAddress('books.zz');
  await click('[aria-label="Go back"]'); await waitAddress('science.zz');
  await click('[aria-label="Go forward"]'); await waitAddress('books.zz');
  await address('history.zz'); await waitAddress('history.zz');
  assert.equal(await evaluate("document.querySelector('[aria-label=\\\"Go forward\\\"]').disabled"), true, 'branch navigation must discard forward entries');

  await click(".side-tabs button:nth-child(2)");
  await evaluate("(() => { const el=document.querySelector('[aria-label=\\\"Search website content\\\"]'); const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; set.call(el,'tide pools'); el.dispatchEvent(new Event('input',{bubbles:true})); el.form.requestSubmit(); return true; })()");
  await eventually(() => evaluate("document.querySelector('.page-canvas')?.textContent.includes('Pages about')"), 'search results');
  await click('.page-canvas button'); await waitAddress('nature.zz');
  await click('[aria-label="Go back"]');
  await eventually(() => evaluate("document.querySelector('.page-canvas')?.textContent.includes('Pages about')"), 'restored search results');

  await click(".side-tabs button:nth-child(3)");
  const fill = async (selector, value) => evaluate(`(() => { const el=document.querySelector(${JSON.stringify(selector)}); const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype; const set=Object.getOwnPropertyDescriptor(proto,'value').set; set.call(el,${JSON.stringify(value)}); el.dispatchEvent(new Event('input',{bubbles:true})); return true; })()`);
  await fill('input[placeholder="garden.zz"]', 'garden.zz');
  await fill('input[placeholder="A small garden"]', 'A published garden');
  await fill('textarea[placeholder]', '<h1>A published page</h1><p>Ready for visitors.</p>');
  await click('.side-panel form button'); await waitAddress('garden.zz');

  await address('missing.zz'); await waitAddress('The Small Web');
  assert.ok(await evaluate("document.querySelector('.page-canvas')?.textContent.includes('Address not found')"), '404 must render the missing-page state');
  await address('failure.zz');
  await eventually(() => evaluate("document.querySelector('[role=alert]')?.textContent.includes('Database unavailable')"), 'database error message');
  assert.equal(await evaluate("document.querySelector('.page-canvas')?.textContent.includes('Address not found')"), true, 'server failure must not replace the current page with a missing page');
  await click('[aria-label="Go back"]'); await waitAddress('garden.zz');
  await address('slow.zz');
  await eventually(() => evaluate("document.querySelector('[role=status]') !== null"), 'pending request before Back');
  await click('[aria-label="Go back"]');
  await eventually(() => pageMeta(), 'Back while request is pending');
  await pause(1100);
  assert.equal(await pageMeta(), 'Search results', 'Back must cancel a pending request and restore the captured page');
  await click('[aria-label="Go forward"]'); await waitAddress('garden.zz');

  await address('slow.zz');
  await address('nature.zz');
  await waitAddress('nature.zz');
  await pause(1100);
  assert.equal(await pageMeta(), 'nature.zz', 'older slow navigation must not overwrite newer navigation');

  await address('slow.zz');
  await eventually(() => evaluate("document.querySelector('[role=status]') !== null"), 'slow request pending');
  await evaluate("(() => { const select=document.querySelector('[aria-label=\\\"Choose browsing user\\\"]'); select.value='reader-b'; select.dispatchEvent(new Event('change',{bubbles:true})); return true; })()");
  await pause(1100);
  assert.equal(await evaluate("document.querySelector('.page-meta span.text-xs.text-slate-400')?.textContent"), "Mina Chen's browser", 'reader switch must invalidate pending navigation');

  console.log('Browser walkthrough passed: browsing, link interception, history, snapshots, branching, search/return, publish, 404/server errors, stale navigation, reader switch, and sandbox/CSP restrictions.');
  await send('Browser.close').catch(() => {});
  socket.close();
}

main().catch((error) => {
  console.error(error);
  browser.kill();
  process.exitCode = 1;
}).finally(() => {
  setTimeout(() => {
    if (browser.exitCode === null) browser.kill();
    fs.rmSync(profile, { recursive: true, force: true });
  }, 500).unref();
});
