import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = fileURLToPath(new URL('../out/', import.meta.url));
const port = Number(process.env.PORT ?? 4173);
const redirects = new Map([
  ['/index.html', '/'],
  ['/track/club-kings', '/track/morozoff-club-kings-d10g3n-remix/'],
  ['/track/club-kings/', '/track/morozoff-club-kings-d10g3n-remix/'],
  ['/track/club-kings-bootleg-remix', '/track/morozoff-club-kings-d10g3n-remix/'],
  ['/track/club-kings-bootleg-remix/', '/track/morozoff-club-kings-d10g3n-remix/'],
]);
const contentTypes = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.map': 'application/json; charset=utf-8', '.mp3': 'audio/mpeg',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8',
};

async function fileFor(pathname) {
  const normalized = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(out, normalized);
  try {
    const info = await stat(file);
    if (info.isDirectory()) file = join(file, 'index.html');
    return { file, info: await stat(file), status: 200 };
  } catch {
    return { file: join(out, '404.html'), info: await stat(join(out, '404.html')), status: 404 };
  }
}

createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
    const redirect = redirects.get(pathname);
    if (redirect) {
      response.writeHead(301, { Location: redirect });
      response.end();
      return;
    }

    const { file, info, status } = await fileFor(pathname);
    const range = request.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    const type = pathname.endsWith('/.well-known/apple-app-site-association')
      ? 'application/json; charset=utf-8'
      : contentTypes[extname(file)] ?? 'application/octet-stream';
    const headers = { 'Accept-Ranges': 'bytes', 'Content-Type': type };

    if (range && status === 200) {
      const start = Number(range[1]);
      const end = range[2] ? Math.min(Number(range[2]), info.size - 1) : info.size - 1;
      if (start > end || start >= info.size) {
        response.writeHead(416, { 'Content-Range': `bytes */${info.size}` });
        response.end();
        return;
      }
      response.writeHead(206, { ...headers, 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${info.size}` });
      if (request.method === 'HEAD') response.end();
      else createReadStream(file, { start, end }).pipe(response);
      return;
    }

    response.writeHead(status, { ...headers, 'Content-Length': info.size });
    if (request.method === 'HEAD') response.end();
    else createReadStream(file).pipe(response);
  } catch {
    response.writeHead(500);
    response.end('Internal Server Error');
  }
}).listen(port, () => console.log(`Serving out/ on http://localhost:${port}`));
