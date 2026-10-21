import { createReadStream } from 'node:fs';
import { access, readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const publicRoot = resolve(root, 'public');
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 4173);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function isLocalRequest(request) {
  const hostHeader = String(request.headers.host || '').toLowerCase();
  const remote = request.socket.remoteAddress || '';
  return /^(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(hostHeader)
    && (remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1');
}

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed');
    return;
  }

  let pathname;
  let requestUrl;
  try {
    requestUrl = new URL(request.url, `http://${host}`);
    pathname = decodeURIComponent(requestUrl.pathname);
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }

  if (pathname === '/_local/demo-properties.json' || pathname.startsWith('/_local/demo-media/')) {
    if (!isLocalRequest(request)) {
      response.writeHead(404).end('Not found');
      return;
    }
    try {
      if (pathname === '/_local/demo-properties.json') {
        const body = await readFile(resolve(root, 'data/demo-properties.json'));
        response.writeHead(200, { 'Cache-Control': 'no-store', 'Content-Length': body.length, 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
        response.end(body);
        return;
      }
      const match = pathname.match(/^\/_local\/demo-media\/(demo-property-(?:(?:0[1-9]|[12][0-9]|30)\.jpg|31\.png|(?:0[1-9]|[12][0-9]|30|31)-complement-[12]\.jpg))$/);
      if (!match) throw new Error('Invalid demo asset');
      const filePath = resolve(root, 'data/demo-media', match[1]);
      const fileInfo = await stat(filePath);
      if (!fileInfo.isFile()) throw new Error('Not a file');
      response.writeHead(200, { 'Cache-Control': 'no-store', 'Content-Length': fileInfo.size, 'Content-Type': match[1].endsWith('.png') ? 'image/png' : 'image/jpeg', 'X-Content-Type-Options': 'nosniff' });
      if (request.method === 'HEAD') response.end();
      else createReadStream(filePath).pipe(response);
      return;
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
      return;
    }
  }

  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = resolve(publicRoot, relativePath);
  if (filePath !== publicRoot && !filePath.startsWith(publicRoot + sep)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  // Client-side routes fall back to the app shell; missing files keep a 404.
  if (!extname(filePath)) {
    response.writeHead(200, { 'Cache-Control': 'no-store', 'Content-Type': 'text/html; charset=utf-8' });
    createReadStream(resolve(publicRoot, 'index.html')).pipe(response);
    return;
  }

  try {
    await access(filePath);
    const fileInfo = await stat(filePath);
    if (!fileInfo.isFile()) throw new Error('Not a file');
    const rangeHeader = request.headers.range;
    const rangeMatch = typeof rangeHeader === 'string' && rangeHeader.match(/^bytes=(\d*)-(\d*)$/);
    if (rangeHeader && !rangeMatch) {
      response.writeHead(416, { 'Content-Range': `bytes */${fileInfo.size}`, 'Accept-Ranges': 'bytes' }).end();
      return;
    }
    if (rangeMatch) {
      const start = rangeMatch[1] ? Number(rangeMatch[1]) : Math.max(0, fileInfo.size - Number(rangeMatch[2] || 0));
      const end = rangeMatch[2] && rangeMatch[1] ? Math.min(Number(rangeMatch[2]), fileInfo.size - 1) : fileInfo.size - 1;
      if (start >= fileInfo.size || end < start) {
        response.writeHead(416, { 'Content-Range': `bytes */${fileInfo.size}`, 'Accept-Ranges': 'bytes' }).end();
        return;
      }
      response.writeHead(206, {
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-store',
        'Content-Length': end - start + 1,
        'Content-Range': `bytes ${start}-${end}/${fileInfo.size}`,
        'Content-Type': contentTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
      });
      if (request.method === 'HEAD') response.end();
      else createReadStream(filePath, { start, end }).pipe(response);
      return;
    }
    response.writeHead(200, {
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
      'Content-Length': fileInfo.size,
      'Content-Type': contentTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    });
    if (request.method === 'HEAD') response.end();
    else createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
  }
});

server.listen(port, host, () => {
  console.log(`Base limpa disponível em http://${host}:${port}`);
});
