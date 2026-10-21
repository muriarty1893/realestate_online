// Headless screenshot of the walkthrough from a named view (or any camera).
//   node tools/shot.mjs --view great_room --out shots/great_room.png
//   node tools/shot.mjs --view great_room --compare refs/inside_view_1.webp   (also writes <out>.cmp.png: ours | photo)
//   node tools/shot.mjs --pos 1,1.6,2 --target 0,1.5,0 --fov 50 --out /tmp/x.png
//   node tools/shot.mjs --top --out shots/plan.png            (roofless plan view)
// Other flags: --w 1789 --h 1200 --preset golden --only exterior,great_room --timeout 180
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { startServer } from './serve.mjs';

const args = process.argv.slice(2);
const opt = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (!a.startsWith('--')) continue;
  const k = a.slice(2);
  const v = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
  opt[k] = v;
}
const view = opt.view || 'start';
const out = path.resolve(opt.out || `shots/${opt.top ? 'plan' : view}.png`);
fs.mkdirSync(path.dirname(out), { recursive: true });

// default size: match the reference photo if one is given
let w = +(opt.w || 0), h = +(opt.h || 0);
const REF_SIZES = { 'front_view.webp': [1789, 1013], 'inside_view_1.webp': [1789, 1200], 'inside_view_2.webp': [1789, 1200] };
if ((!w || !h) && opt.compare) [w, h] = REF_SIZES[path.basename(opt.compare)] || [1789, 1200];
if (!w || !h) [w, h] = opt.top ? [1800, 1200] : [1789, 1200];

const server = await startServer(0);
const port = server.address().port;
const qs = new URLSearchParams({ shot: '1', view, w: String(w), h: String(h) });
for (const k of ['pos', 'target', 'fov', 'preset', 'only']) if (opt[k]) qs.set(k, opt[k]);
if (opt.top) qs.set('top', '1');

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || '/usr/bin/chromium',
  headless: true,
  args: ['--use-angle=vulkan', '--enable-features=Vulkan', '--ignore-gpu-blocklist', '--enable-unsafe-webgpu', '--disable-dev-shm-usage'],
});
const t0 = Date.now();
let code = 0;
try {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const logs = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => logs.push('requestfailed: ' + r.url()));
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) logs.push(`http ${r.status()}: ${r.url()}`); });
  await page.goto(`http://127.0.0.1:${port}/index.html?${qs}`);
  await page.waitForFunction('window.__shotReady === true', null, { timeout: (+opt.timeout || 180) * 1000, polling: 250 });
  const info = await page.evaluate(() => ({ errors: window.__errors, info: window.__info }));
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: w, height: h } });
  console.log(`saved ${path.relative(process.cwd(), out)} (${w}x${h}) in ${((Date.now() - t0) / 1000).toFixed(1)}s`, JSON.stringify(info.info));
  const uniq = [...new Set([...info.errors, ...logs])].filter((l) => !/favicon|status of 404 \(Not Found\)$|KHR_parallel_shader_compile|GPU stall due to ReadPixels|WebGL: INVALID_VALUE: texImage|Automatic fallback to software/.test(l));
  if (uniq.length) { console.log('--- page errors/warnings ---'); for (const l of uniq.slice(0, 40)) console.log(l.slice(0, 600)); }

  if (opt.compare) {
    const ours = fs.readFileSync(out).toString('base64');
    const H = 640;
    const cmp = await browser.newPage({ viewport: { width: Math.round((H * w) / h) * 2 + 12, height: H + 30 } });
    await cmp.goto(`http://127.0.0.1:${port}/refs/`).catch(() => {});
    await cmp.setContent(`<html><body style="margin:0;background:#222;color:#eee;font:14px sans-serif">
      <div style="display:flex;gap:12px"><div><img id=a style="height:${H}px" src="data:image/png;base64,${ours}"><div>OURS</div></div>
      <div><img id=b style="height:${H}px" src="http://127.0.0.1:${port}/${opt.compare}"><div>PHOTO</div></div></div></body></html>`);
    await cmp.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 30000 });
    const cmpOut = out.replace(/\.png$/, '') + '.cmp.png';
    await cmp.screenshot({ path: cmpOut, fullPage: true });
    console.log('saved ' + path.relative(process.cwd(), cmpOut));
  }
} catch (e) {
  console.error('SHOT FAILED:', e.message);
  code = 1;
} finally {
  await browser.close();
  server.close();
}
process.exit(code);
