#!/usr/bin/env node
// Petit serveur local pour prévisualiser dist/ : npm run serve, puis http://localhost:8080
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const DIST = path.resolve(__dirname, '..', 'dist');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(DIST, path.normalize(p));
  if (!f.startsWith(DIST) || !fs.existsSync(f)) { res.writeHead(404); return res.end(fs.existsSync(path.join(DIST, '404.html')) ? fs.readFileSync(path.join(DIST, '404.html')) : 'Introuvable'); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(8080, () => console.log('→ http://localhost:8080  (Ctrl+C pour arrêter)'));
