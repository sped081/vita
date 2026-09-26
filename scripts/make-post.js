#!/usr/bin/env node
// Génère une image Instagram (PNG 1080x1350) dans le style Quoi d'neuf MTL.
//
//   npm run post -- debat "ST-VIATEUR" "FAIRMOUNT" "Le meilleur bagel, c'est lequel ?"
//   npm run post -- annonce "NOUVELLE VIDÉO" "Bixi contre métro : la course" "Ce soir 18 h"
//   npm run post -- liste "5 AFFAIRES DE MONTRÉALAIS" "Les cônes orange" "Le 1er juillet" "Les escaliers"
//
// Le PNG est écrit dans out/. Il faut un Chromium : Chrome, Chromium ou celui
// installé par Playwright (variable CHROME_PATH pour forcer un chemin).
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'out');
const W = 1080, H = 1350;
const C = { navy: '#12233b', red: '#E63917', bone: '#F4F1EA', gold: '#E8A33D' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const font = (f) => fs.readFileSync(path.join(ROOT, 'assets/fonts', f)).toString('base64');
const faces = `@font-face{font-family:Osw;src:url(data:font/ttf;base64,${font('Oswald-Bold.ttf')})}
@font-face{font-family:Arc;src:url(data:font/ttf;base64,${font('Archivo-ExtraBold.ttf')})}`;

const logo = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M0 0h200a24 24 0 0 1 24 24v86a24 24 0 0 1-24 24h-96l-36 32v-32H24a24 24 0 0 1-24-24V24A24 24 0 0 1 24 0z" fill="${C.red}"/><text x="112" y="98" text-anchor="middle" font-family="Osw" font-size="92" fill="${C.bone}">QDN</text></g>`;
const handle = (col) => `<text x="80" y="110" font-family="Arc" font-size="34" fill="${col}" letter-spacing="2">@quoidneufmtl</text>`;
// Coupe un titre trop long en lignes, puis les empile.
function stack(text, x, y, size, col, maxChars) {
  const words = String(text).split(/\s+/); const lines = []; let cur = '';
  for (const w of words) { if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
  if (cur) lines.push(cur);
  return lines.map((l, i) => `<text x="${x}" y="${y + i * size * 1.06}" font-family="Osw" font-size="${size}" fill="${col}">${esc(l)}</text>`).join('');
}

const TEMPLATES = {
  // debat A B [question]
  debat: ([a, b, q = 'Ton camp ? Dis-le en commentaire']) => `
    <rect width="${W}" height="${H}" fill="${C.bone}"/>${handle(C.navy)}
    <text x="80" y="220" font-family="Arc" font-size="40" fill="${C.red}" letter-spacing="10">LE GRAND DÉBAT</text>
    <text x="540" y="470" text-anchor="middle" font-family="Osw" font-size="${a.length > 9 ? 150 : 182}" fill="${C.navy}">${esc(a)}</text>
    <circle cx="540" cy="640" r="92" fill="${C.red}"/><text x="540" y="680" text-anchor="middle" font-family="Osw" font-size="106" fill="${C.bone}">VS</text>
    <text x="540" y="900" text-anchor="middle" font-family="Osw" font-size="${b.length > 9 ? 150 : 182}" fill="${C.navy}">${esc(b)}</text>
    <rect x="0" y="1110" width="${W}" height="240" fill="${C.navy}"/>
    ${stack(q, 80, 1220, 60, C.bone, 28)}
    ${logo(830, 1170, 0.8)}`,
  // annonce KICKER Titre [sous-titre]
  annonce: ([kick, title, sub = '']) => `
    <rect width="${W}" height="${H}" fill="${C.navy}"/>${handle(C.gold)}
    <text x="80" y="300" font-family="Arc" font-size="40" fill="${C.red}" letter-spacing="10">${esc(kick.toUpperCase())}</text>
    ${stack(title, 80, 470, 128, C.bone, 16)}
    <text x="80" y="1060" font-family="Arc" font-size="46" fill="${C.gold}">${esc(sub)}</text>
    <rect x="80" y="1150" width="330" height="90" rx="45" fill="${C.bone}"/>
    <text x="245" y="1209" text-anchor="middle" font-family="Arc" font-size="36" fill="${C.navy}" letter-spacing="3">ABONNE-TOI</text>
    ${logo(830, 1150, 0.8)}`,
  // liste Titre item1 item2 ... (max 7)
  liste: ([title, ...items]) => `
    <rect width="${W}" height="${H}" fill="${C.navy}"/>${handle(C.gold)}
    ${stack(title, 80, 330, 108, C.bone, 20)}
    ${items.slice(0, 7).map((t, i) => `<circle cx="100" cy="${612 + i * 72}" r="12" fill="${C.red}"/><text x="136" y="${628 + i * 72}" font-family="Osw" font-size="54" fill="${C.bone}">${esc(t)}</text>`).join('')}
    <text x="80" y="1250" font-family="Arc" font-size="42" fill="${C.gold}">Dis-nous en commentaire 👇</text>
    ${logo(830, 1150, 0.8)}`,
};

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const cands = ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
  const pw = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(require('os').homedir(), '.cache/ms-playwright');
  if (fs.existsSync(pw)) for (const d of fs.readdirSync(pw)) {
    for (const bin of ['chrome-linux/headless_shell', 'chrome-linux/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']) {
      const p = path.join(pw, d, bin); if (fs.existsSync(p)) cands.unshift(p);
    }
  }
  const found = cands.find((p) => fs.existsSync(p));
  if (!found) throw new Error('Aucun Chromium trouvé. Installez Chrome ou définissez CHROME_PATH.');
  return found;
}

function main() {
  const [tpl, ...args] = process.argv.slice(2);
  if (!TEMPLATES[tpl] || args.length < 2) {
    console.error(`Usage : node scripts/make-post.js <${Object.keys(TEMPLATES).join('|')}> "texte 1" "texte 2" [...]`);
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });
  const name = `${tpl}-${args[0].toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}-${Date.now().toString(36)}`;
  const html = `<html><head><meta charset="utf-8"><style>${faces}html,body{margin:0}svg{display:block}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${TEMPLATES[tpl](args)}</svg></body></html>`;
  const tmp = path.join(OUT, `${name}.html`);
  fs.writeFileSync(tmp, html);
  const png = path.join(OUT, `${name}.png`);
  execFileSync(findChrome(), ['--headless=new', '--no-sandbox', '--hide-scrollbars', '--disable-gpu', '--virtual-time-budget=3000',
    `--window-size=${W},${H}`, `--screenshot=${png}`, `file://${tmp}`], { stdio: 'ignore' });
  fs.unlinkSync(tmp);
  console.log(`✔ ${path.relative(ROOT, png)}`);
}

main();
