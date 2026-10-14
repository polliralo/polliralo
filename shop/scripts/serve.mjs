// Local preview server for the MONO shop. No dependencies.
//
//   npm run shop:start                -> http://localhost:4174
//   PORT=5000 npm run shop:start      -> another port
//
// Serves shop/site like a static host: /cart/ -> cart/index.html, /cart
// redirects to /cart/, and unknown addresses get 404.html.

import { createReadStream, statSync, existsSync } from 'node:fs';
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
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.ico': 'image/x-icon',
};

function inside(file) {
  return file === ROOT || file.startsWith(ROOT + sep);
}

function send(res, file, status = 200, method = 'GET') {
  const stats = statSync(file);
  res.writeHead(status, {
    'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
    'Content-Length': stats.size,
    'Cache-Control': 'no-cache',
  });
  if (method === 'HEAD') return res.end();
  createReadStream(file).pipe(res);
}

const server = createServer((req, res) => {
  let url;
  try {
    url = new URL(req.url, 'http://localhost');
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }
  const target = normalize(join(ROOT, pathname));
  if (!inside(target)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  // Directory without a trailing slash: redirect, like most static hosts.
  if (!pathname.endsWith('/') && existsSync(target) && statSync(target).isDirectory()) {
    res.writeHead(301, { Location: `${pathname}/${url.search}` }).end();
    return;
  }
  const file = pathname.endsWith('/') ? join(target, 'index.html') : target;
  if (existsSync(file) && statSync(file).isFile()) {
    send(res, file, 200, req.method);
    return;
  }
  const notFound = join(ROOT, '404.html');
  if (existsSync(notFound)) send(res, notFound, 404, req.method);
  else res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
});

server.listen(PORT, HOST, () => {
  console.log(`MONO preview: http://localhost:${PORT}`);
});
