import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseDir = path.resolve(root, process.argv[2] || '.');
const port = Number(process.argv[3] || process.env.PORT || 5173);

const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.wav': 'audio/wav'
};

const server = http.createServer(async (req, res) => {
    try {
        const requestUrl = new URL(req.url, `http://${req.headers.host}`);
        const decoded = decodeURIComponent(requestUrl.pathname);
        let filePath = path.resolve(baseDir, `.${decoded === '/' ? '/index.html' : decoded}`);

        if (!filePath.startsWith(baseDir)) {
            res.writeHead(403).end('Forbidden');
            return;
        }

        const info = await stat(filePath);
        if (info.isDirectory()) filePath = path.join(filePath, 'index.html');

        res.writeHead(200, {
            'Content-Type': mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
            'Cache-Control': 'no-cache'
        });
        createReadStream(filePath).pipe(res);
    } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
    }
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
