// Triangle, mesh and light counts per top-level scene group: node tools/tris.mjs [view]
import { chromium } from 'playwright-core';
import { startServer } from './serve.mjs';
const server = await startServer(0); const port = server.address().port;
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--use-angle=vulkan','--enable-features=Vulkan','--ignore-gpu-blocklist','--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
await page.goto(`http://127.0.0.1:${port}/index.html?shot=1&view=${process.argv[2] || 'front'}&w=800&h=500`);
await page.waitForFunction('window.__shotReady === true', null, { timeout: 180000 });
const r = await page.evaluate(() => {
  const { scene } = window.__ctx; const out = {};
  for (const top of scene.children) {
    let t = 0, m = 0, lights = 0, shadow = 0;
    top.traverse((o) => {
      if (o.isLight) { lights++; if (o.castShadow) shadow++; }
      if (!o.isMesh || !o.geometry) return;
      const g = o.geometry, n = g.index ? g.index.count / 3 : (g.attributes.position?.count || 0) / 3;
      t += n * (o.isInstancedMesh ? o.count : 1); m++;
    });
    const k = top.name || top.type; out[k] = out[k] || { tris: 0, meshes: 0, lights: 0, shadow: 0 };
    out[k].tris += Math.round(t); out[k].meshes += m; out[k].lights += lights; out[k].shadow += shadow;
  }
  return out;
});
for (const [k, v] of Object.entries(r)) if (v.tris > 1000 || v.lights) console.log(k.padEnd(28), String(v.tris).padStart(9), 'tris', v.meshes, 'meshes', v.lights, 'lights', v.shadow, 'shadow');
await browser.close(); server.close();
