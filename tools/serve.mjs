// Tiny static server with no-cache headers. Usage: node tools/serve.mjs [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.hdr': 'application/octet-stream', '.exr': 'application/octet-stream', '.bin': 'application/octet-stream',
  '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.ktx2': 'image/ktx2', '.wasm': 'application/wasm', '.css': 'text/css',
};

export function startServer(port = 0) {
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let f = path.join(ROOT, u === '/' ? '/index.html' : u);
    if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    fs.stat(f, (err, st) => {
      if (err || !st.isFile()) { res.writeHead(404); return res.end('not found: ' + u); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(f).pipe(res);
    });
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = +(process.argv[2] || 8080);
  startServer(port).then(() => console.log(`Walkthrough at http://localhost:${port}/`));
}
