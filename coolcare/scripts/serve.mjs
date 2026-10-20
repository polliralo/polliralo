// Minimal static server for previewing the site locally. No dependencies.
//
//   npm start                 -> http://localhost:4174
//   PORT=8080 npm start       -> http://localhost:8080
//   HOST=0.0.0.0 npm start    -> also reachable from other devices on your network

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../site', import.meta.url));
const PORT = Number(process.env.PORT) || 4174;
const HOST = process.env.HOST || '127.0.0.1';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function resolvePath(url) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(url, 'http://localhost').pathname);
  } catch {
    return null; // malformed address
  }
  const file = normalize(join(ROOT, pathname.endsWith('/') ? `${pathname}index.html` : pathname));
  return file === ROOT || file.startsWith(ROOT + sep) ? file : null; // stay inside site/
}

const server = createServer((req, res) => {
  const file = resolvePath(req.url);
  let stats;
  try {
    stats = file && statSync(file);
  } catch {
    stats = null;
  }
  if (!stats || !stats.isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  res.writeHead(200, {
    'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
    'Content-Length': stats.size,
    'Cache-Control': 'no-cache',
  });
  if (req.method === 'HEAD') return res.end();
  createReadStream(file).pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`CoolCare preview: http://localhost:${PORT}`);
});
