// Génère les captures d'écran pour l'App Store (iPhone 6,9 po : 1290 × 2796) à partir de www/.
// Usage : npm run build && npm run screenshots   (demande playwright-core et un Chromium ; voir README)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const here = __dirname;
const www = path.join(here, '..', 'www');
const out = path.join(here, '..', 'store', 'screenshots');
const fonts = 'file://' + path.join(www, 'fonts', 'fonts.css');
const W = 1290, H = 2796;

const SHOTS = [
  { file: '01-accueil.png', title: "Toute votre session,<br>d'un coup d'œil", sub: "Horaire, examens, moyennes et plan d'étude.", setup: async () => {} },
  { file: '02-cote-r.png', title: 'Votre cote R,<br>estimée en direct', sub: 'Et le cours où chaque point compte le plus.', setup: async (p) => { await p.click('nav [data-tab="courses"]'); } },
  { file: '03-oracle.png', title: 'Vos chances de<br>réussite, simulées', sub: '3 000 fins de session calculées avec vos notes.', setup: async (p) => {
    await p.evaluate(() => { const h = [...document.querySelectorAll('#s-today .card h2')].find((x) => x.textContent.includes('oracle')); window.scrollTo(0, h.closest('.card').getBoundingClientRect().top + scrollY - 14); });
  } },
  { file: '04-fiches.png', title: 'Des fiches<br>qui se glissent', sub: 'À droite : je savais. À gauche : à revoir.', setup: async (p) => {
    await p.click('nav [data-tab="cards"]'); await p.waitForTimeout(600); await p.click('#startStudy'); await p.waitForTimeout(700);
    await p.click('#fShow'); await p.waitForTimeout(900);
    const b = await p.locator('.swipe').boundingBox(); const x = b.x + b.width / 2, y = b.y + b.height / 2;
    await p.mouse.move(x, y); await p.mouse.down();
    for (let i = 1; i <= 8; i++) { await p.mouse.move(x + i * 9, y + i); await p.waitForTimeout(16); }
  } },
  { file: '05-focus.png', title: 'Un mode Focus<br>qui respire', sub: 'Minuteur, sons de pluie, une étoile par séance.', setup: async (p) => {
    await p.click('.play[data-focus]'); await p.waitForTimeout(400);
    await p.evaluate(() => { window.__ms.setFocusDur(1500); window.__ms.focus.left = 1043; });
    await p.click('#fzGo'); await p.click('[data-snd="rain"]');
  } },
  { file: '06-constellation.png', title: 'Votre mémoire,<br>en constellation', sub: "Chaque fiche est une étoile qui pâlit quand vous l'oubliez.", setup: async (p) => { await p.click('nav [data-tab="cards"]'); } },
];

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  for (const s of SHOTS) {
    // 1. L'app, avec la session d'exemple, un lundi soir d'octobre à 21 h 30.
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, reducedMotion: 'no-preference' });
    const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date(2026, 9, 5, 21, 30));
    await p.goto('file://' + path.join(www, 'index.html'));
    await p.addStyleTag({ content: '#exbar{display:none!important}' });
    await p.evaluate(() => document.fonts.ready);
    await p.click('#setOpen'); await p.fill('#sName', 'Alex'); await p.press('#sName', 'Tab'); await p.click('#setClose');
    await p.waitForTimeout(300);
    await s.setup(p);
    await p.waitForTimeout(1900);
    const shot = await p.screenshot();
    await ctx.close();

    // 2. Le cadre : titre, sous-titre et l'écran de l'app.
    const frame = await browser.newPage({ viewport: { width: W, height: H } });
    const tmp = path.join(out, '.cadre.html');
    fs.writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${fonts}"><style>
      html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:#090C13}
      body{background:radial-gradient(60% 35% at 10% 0%,rgba(79,209,184,.30),transparent 70%),radial-gradient(55% 30% at 100% 12%,rgba(140,123,255,.26),transparent 70%),radial-gradient(70% 30% at 50% 100%,rgba(255,210,77,.12),transparent 70%),linear-gradient(180deg,#131C3C,#090C13 60%);font-family:Figtree,sans-serif;color:#EEF1F7}
      .t{position:absolute;left:0;right:0;top:150px;text-align:center;font-family:Fraunces,serif;font-weight:700;font-size:104px;line-height:1.04;letter-spacing:-1px}
      .s{position:absolute;left:90px;right:90px;top:400px;text-align:center;font-size:46px;line-height:1.3;color:#AEB6C8}
      .ph{position:absolute;left:50%;top:600px;width:960px;transform:translateX(-50%);border-radius:78px;overflow:hidden;border:4px solid rgba(255,255,255,.16);box-shadow:0 40px 120px rgba(0,0,0,.6),0 0 0 14px rgba(255,255,255,.035)}
      .ph img{display:block;width:100%}
      .st{position:absolute;width:6px;height:6px;border-radius:50%;background:#fff}
    </style></head><body>
      ${[[120, 90, .7], [1120, 120, .6], [220, 520, .4], [1180, 470, .5], [60, 330, .45], [1010, 300, .35]].map(([x, y, o]) => `<i class="st" style="left:${x}px;top:${y}px;opacity:${o}"></i>`).join('')}
      <div class="t">${s.title}</div><div class="s">${s.sub}</div>
      <div class="ph"><img src="data:image/png;base64,${shot.toString('base64')}"></div>
    </body></html>`);
    await frame.goto('file://' + tmp);
    await frame.evaluate(() => document.fonts.ready.then(() => Promise.all([...document.images].map((i) => i.decode()))));
    await frame.screenshot({ path: path.join(out, s.file) });
    await frame.close();
    fs.rmSync(tmp);
    console.log('écrit', s.file);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
