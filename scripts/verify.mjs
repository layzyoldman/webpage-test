#!/usr/bin/env node
/**
 * scripts/verify.mjs — structural checks against a running site (dev/preview).
 *
 *   node scripts/verify.mjs http://localhost:4321
 *
 * Uses Chrome DevTools Protocol directly (no dependencies): launches system
 * Chromium headless, then per page checks what .agents/verification.md lists:
 *   - no horizontal overflow at 320 px
 *   - exactly one <h1>, no heading-level jumps
 *   - first Tab focuses the skip link
 *   - no console errors / page exceptions
 *   - reduced motion: the wordmark animation resolves to its end state
 *   - keyboard: the mobile <details> menu and the project filters are operable
 *   - forms: the PDF flow downloads the PDF and shows the "send it" note
 *   - no-JS: the forms hide and their mailto fallback takes over
 * Exit code 1 on any failure.
 */
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = (process.argv[2] ?? 'http://localhost:4321').replace(/\/$/, '');
const PAGES = [
  '/pt/',
  '/pt/sobre/',
  '/pt/equipa/',
  '/pt/eventos/',
  '/pt/tornar-me-socio/',
  '/pt/area-de-socio/',
  '/pt/doacoes/',
  '/pt/apoios/',
];

/* ---------------------------------------------------------- CDP plumbing */

const chrome = spawn('chromium-browser', [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--remote-debugging-port=0',
  '--force-device-scale-factor=1',
  '--window-size=1280,900',
  'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

const wsUrl = await new Promise((resolve, reject) => {
  let buf = '';
  chrome.stderr.on('data', (chunk) => {
    buf += chunk;
    const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
    if (m) resolve(m[1]);
  });
  chrome.on('exit', () => reject(new Error('chromium exited early')));
  setTimeout(() => reject(new Error('no DevTools endpoint')), 15000);
});

const ws = new WebSocket(wsUrl);
await new Promise((res) => ws.addEventListener('open', res, { once: true }));

let id = 0;
const pending = new Map();
const events = [];
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  } else if (msg.method) {
    events.push(msg);
  }
});
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const msgId = ++id;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params, ...(sessionId ? { sessionId } : {}) }));
  });

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const cdp = (method, params) => send(method, params, sessionId);

/* -------------------------------------------------------------- checks */

let failures = 0;
const report = (page, name, ok, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${page} — ${name}${detail ? ` (${detail})` : ''}`);
};

for (const path of PAGES) {
  const url = base + path;
  events.length = 0;
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Log.enable');
  await cdp('Emulation.setDeviceMetricsOverride', {
    width: 320, height: 800, deviceScaleFactor: 1, mobile: true,
  });
  await cdp('Page.navigate', { url });
  await new Promise((r) => setTimeout(r, 700));

  const evalJs = async (expression) =>
    (await cdp('Runtime.evaluate', { expression, returnByValue: true })).result?.value;

  // 320 px: no horizontal overflow
  const overflow = await evalJs(
    'document.documentElement.scrollWidth - document.documentElement.clientWidth',
  );
  report(path, 'no horizontal overflow at 320px', overflow <= 1, `overflow ${overflow}px`);

  // one h1, no heading jumps
  const headings = await evalJs(
    '[...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(h=>+h.tagName[1])',
  );
  const h1s = headings.filter((l) => l === 1).length;
  let jump = 0;
  for (let i = 1; i < headings.length; i++) if (headings[i] - headings[i - 1] > 1) jump++;
  report(path, 'exactly one h1', h1s === 1, `${h1s} found`);
  report(path, 'no heading-level jumps', jump === 0, `${jump} jumps`);

  // first Tab reaches the skip link
  await evalJs('document.activeElement.blur(); document.body.focus()');
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  const focused = await evalJs('document.activeElement.className');
  report(path, 'first Tab focuses skip link', /skip-link/.test(focused ?? ''), String(focused));

  // console errors
  const errors = events.filter(
    (e) =>
      (e.method === 'Runtime.exceptionThrown') ||
      (e.method === 'Log.entryAdded' && e.params.entry.level === 'error'),
  );
  const errorText = errors
    .map((e) => e.params?.entry?.text ?? e.params?.exceptionDetails?.text ?? e.method)
    .join(' | ')
    .slice(0, 160);
  report(path, 'no console errors', errors.length === 0, errorText || `${errors.length} errors`);
}

// reduced motion: the wordmark resolves to its finished state
await cdp('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
});
await cdp('Page.navigate', { url: base + '/pt/' });
await new Promise((r) => setTimeout(r, 500));
const dash = await (async () =>
  (await cdp('Runtime.evaluate', {
    expression:
      'getComputedStyle(document.querySelector(".wordmark-pen")).strokeDashoffset',
    returnByValue: true,
  })).result?.value)();
report('/pt/', 'reduced motion shows the finished wordmark', dash === '0px', `dashoffset ${dash}`);

/* keyboard: a key press that must ACTIVATE needs `text` — a bare
 * rawKeyDown/keyUp never runs the activation behaviour of <summary>. */
const js = async (expression) =>
  (await cdp('Runtime.evaluate', { expression, returnByValue: true })).result?.value;
const press = async (key, vk, text) => {
  await cdp('Input.dispatchKeyEvent', {
    type: 'keyDown', key, windowsVirtualKeyCode: vk,
    ...(text ? { text, unmodifiedText: text } : {}),
  });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key, windowsVirtualKeyCode: vk });
  await new Promise((r) => setTimeout(r, 80));
};
const focusTop = () => js('document.activeElement && document.activeElement.blur(); document.body.focus()');
const tabTo = async (isThere, max = 40) => {
  for (let i = 0; i < max; i++) {
    await press('Tab', 9);
    if (await isThere()) return i + 1;
  }
  return -1;
};

// keyboard: the mobile <details> menu opens and takes focus into its links
await cdp('Emulation.setDeviceMetricsOverride', {
  width: 320, height: 800, deviceScaleFactor: 1, mobile: true,
});
await cdp('Page.navigate', { url: base + '/pt/' });
await new Promise((r) => setTimeout(r, 500));
await focusTop();
const summaryTab = await tabTo(
  () => js(`document.activeElement.tagName === 'SUMMARY'`),
);
report('/pt/', 'keyboard: mobile menu summary is reachable', summaryTab > 0, `tab #${summaryTab}`);
if (summaryTab > 0) {
  await press('Enter', 13, '\r');
  report('/pt/', 'keyboard: Enter opens the mobile menu',
    await js(`document.querySelector('.nav-mobile').open === true`));
  let inPanel = false;
  for (let i = 0; i < 12 && !inPanel; i++) {
    await press('Tab', 9);
    inPanel = await js(`!!document.activeElement.closest('.nav-mobile-panel')`);
  }
  report('/pt/', 'keyboard: Tab continues into the menu links', inPanel);
}

// keyboard: the CSS-only project filters respond to keys
await cdp('Page.navigate', { url: base + '/pt/projetos/' });
await new Promise((r) => setTimeout(r, 500));
await focusTop();
const radioTab = await tabTo(
  () => js(`document.activeElement.type === 'radio'`),
);
report('/pt/projetos/', 'keyboard: filter radios are reachable', radioTab > 0, `tab #${radioTab}`);
if (radioTab > 0) {
  const before = await js('document.activeElement.id');
  await press('ArrowDown', 40);
  const after = await js('document.activeElement.id');
  report('/pt/projetos/', 'keyboard: arrow keys move the selection',
    before !== after, `${before} → ${after}`);
  const hidden = await js(`(() => {
    const grid = document.querySelector('.projects-grid');
    return grid ? [...grid.children].filter((el) => getComputedStyle(el).display === 'none').length : -1;
  })()`);
  report('/pt/projetos/', 'keyboard: the selection filters the grid (CSS :has)',
    hidden > 0, `${hidden} card(s) hidden`);
}

// forms: the PDF flow (fill → submit → the PDF lands + the "send it" note)
// and the no-JS mailto fallback (public/pdf-form.js + the html.js gate).
const dl = mkdtempSync(join(tmpdir(), 'plink-verify-dl-'));
await cdp('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: dl, eventsEnabled: true });

const formFlow = async (path, fillExpr, filename, expectText) => {
  await cdp('Page.navigate', { url: base + path });
  await new Promise((r) => setTimeout(r, 700));
  report(path, 'form: the fields fill', (await js(fillExpr)) === true);
  await js(`document.querySelector('form[data-pdf]').requestSubmit()`);
  await new Promise((r) => setTimeout(r, 400));
  report(path, 'form: the "send it" note appears',
    await js(`(() => { const n = document.querySelector('[data-pdf-sent]'); return !!n && !n.hidden; })()`));
  let landed = '';
  for (let i = 0; i < 20 && !landed; i++) {
    await new Promise((r) => setTimeout(r, 150));
    landed = readdirSync(dl).find((f) => f === filename) ?? '';
  }
  report(path, `form: ${filename} downloads`, landed === filename, landed || 'no file');
  if (landed) {
    /* The label mapping (label[for] / closest('label')) once silently fell
       back to raw field names — assert the PDF's actual text. */
    let text = '';
    try {
      text = execFileSync('pdftotext', [join(dl, filename), '-'], { encoding: 'utf8' });
    } catch (err) {
      if (err.code === 'ENOENT') text = null; /* poppler not installed: skip */
    }
    report(path, 'form: the PDF carries the field labels',
      text === null ? true : text.includes(expectText),
      text === null ? 'pdftotext unavailable' : expectText);
  }
};

await formFlow('/pt/tornar-me-socio/', `(() => {
  const f = document.querySelector('form[data-pdf]');
  f.querySelector('#nome').value = 'José Ávila — Teste 100 €';
  f.querySelector('#email').value = 'teste@example.com';
  f.querySelector('#notas').value = 'Nota\\ncom quebras';
  const box = f.querySelector('input[type=checkbox][name=interesses]');
  if (box) box.checked = true;
  f.querySelector('input[name=consentimento]').checked = true;
  return true;
})()`, 'adesao-plink.pdf', 'Nome completo');

await formFlow('/pt/eventos/', `(() => {
  const f = document.querySelector('form[data-pdf]');
  f.querySelector('input[type=email]').value = 'teste@example.com';
  return true;
})()`, 'subscricao-eventos-plink.pdf', 'O teu email');

await cdp('Emulation.setScriptExecutionDisabled', { value: true });
await cdp('Page.navigate', { url: base + '/pt/tornar-me-socio/' });
await new Promise((r) => setTimeout(r, 500));
report('/pt/tornar-me-socio/', 'no-JS: the form hides',
  (await js(`getComputedStyle(document.querySelector('form[data-pdf]')).display`)) === 'none');
report('/pt/tornar-me-socio/', 'no-JS: the mailto fallback shows',
  await js(`(() => { const p = document.querySelector('.no-js');
    return !!p && getComputedStyle(p).display !== 'none' && !!p.querySelector('a[href^="mailto:"]'); })()`));
await cdp('Emulation.setScriptExecutionDisabled', { value: false });
rmSync(dl, { recursive: true, force: true });

console.log(failures ? `\n${failures} check(s) failed.` : '\nAll structural checks passed.');
chrome.kill();
process.exit(failures ? 1 : 0);
