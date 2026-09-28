// Génère les icônes et l'écran de lancement à partir de tools/icon.svg.
// Usage : npm run assets   (demande playwright-core et un Chromium ; voir README)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const here = __dirname;
const out = path.join(here, '..', 'assets', 'icons');
const svg = fs.readFileSync(path.join(here, 'icon.svg'), 'utf8');
const uri = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');

// Étoile seule, pour l'écran de lancement (fond uni, centrée : iOS recadre l'image).
const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2732 2732" width="2732" height="2732">
<defs><radialGradient id="h" cx="1366" cy="1366" r="620" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFE38A" stop-opacity=".38"/><stop offset=".4" stop-color="#FFD24D" stop-opacity=".1"/><stop offset="1" stop-color="#FFD24D" stop-opacity="0"/></radialGradient>
<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFBEA"/><stop offset=".6" stop-color="#FFE9A6"/><stop offset="1" stop-color="#FFC93A"/></linearGradient></defs>
<rect width="2732" height="2732" fill="#090C13"/><rect width="2732" height="2732" fill="url(#h)"/>
<path d="M1366 1136 Q1382 1350 1596 1366 Q1382 1382 1366 1596 Q1350 1382 1136 1366 Q1350 1350 1366 1136 Z" fill="url(#s)"/>
<radialGradient id="c" cx="1366" cy="1366" r="52" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><circle cx="1366" cy="1366" r="52" fill="url(#c)"/></svg>`;

const jobs = [
  ['icon-1024.png', 1024, uri],
  ['icon-512.png', 512, uri],
  ['maskable-512.png', 512, uri],
  ['icon-192.png', 192, uri],
  ['apple-touch-icon.png', 180, uri],
  ['icon-64.png', 64, uri],
  ['splash-2732.png', 2732, 'data:image/svg+xml;base64,' + Buffer.from(splashSvg).toString('base64')],
];

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  for (const [name, size, src] of jobs) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>html,body{margin:0;background:#090C13}img{display:block;width:${size}px;height:${size}px}</style><img src="${src}">`);
    await page.waitForFunction(() => document.images[0].complete);
    await page.screenshot({ path: path.join(out, name), clip: { x: 0, y: 0, width: size, height: size } });
    console.log('écrit', name);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
