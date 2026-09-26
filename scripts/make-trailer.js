#!/usr/bin/env node
// Génère la bande-annonce du compte : une vidéo verticale 1080x1920 (Reel / story).
//
//   npm run trailer            → out/bande-annonce.mp4 (et .webm)
//
// Principe : une page HTML dessine chaque scène en fonction du temps (seek(t)),
// Playwright capture une image par frame, puis ffmpeg assemble la vidéo.
// Il faut playwright-core (npm i -D playwright-core) et un Chromium ; ffmpeg est
// cherché dans le PATH ou dans le dossier de Playwright.
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const ART = require('./lib/illustrations');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'out');
const FRAMES = path.join(OUT, 'frames');
const W = 1080, H = 1920, FPS = 30, DURATION = 13;

const font = (f) => fs.readFileSync(path.join(ROOT, 'assets/fonts', f)).toString('base64');

function findInPlaywright(sub) {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(os.homedir(), '.cache/ms-playwright');
  if (!fs.existsSync(base)) return null;
  for (const d of fs.readdirSync(base)) { const p = path.join(base, d, sub); if (fs.existsSync(p)) return p; }
  return null;
}
function findChrome() {
  return process.env.CHROME_PATH || findInPlaywright('chrome-linux/headless_shell') || findInPlaywright('chrome-linux/chrome')
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
}
function findFfmpeg() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  try { return require('ffmpeg-static'); } catch (e) { /* pas installé */ }
  return findInPlaywright('ffmpeg-linux') || findInPlaywright('ffmpeg-mac') || 'ffmpeg';
}

// ---------- la page animée ----------
const skyline = `<svg viewBox="0 0 1440 260" preserveAspectRatio="none" style="position:absolute;left:0;right:0;bottom:0;width:100%;height:420px"><g fill="#0B1528"><path d="M0 260 L0 190 C 80 150 160 128 250 132 C 330 136 380 165 440 190 L 440 260 Z"/><rect x="246" y="86" width="6" height="52"/><rect x="232" y="100" width="34" height="6"/><rect x="470" y="150" width="40" height="110"/><rect x="520" y="120" width="30" height="140"/><path d="M560 260 V110 h40 v150z M566 110 l14 -30 l14 30z"/><path d="M620 260 V70 h18 v-14 h22 v14 h18 v190z"/><rect x="690" y="130" width="34" height="130"/><path d="M740 260 V95 l28 -40 l28 40 v165z"/><rect x="810" y="140" width="26" height="120"/><rect x="846" y="160" width="44" height="100"/><rect x="905" y="90" width="34" height="170"/><rect x="950" y="150" width="28" height="110"/><path d="M1000 205 h340" stroke="#0B1528" stroke-width="6" fill="none"/><path d="M1040 205 c 40 -70 90 -70 130 0 c 40 -70 90 -70 130 0" stroke="#0B1528" stroke-width="7" fill="none"/><rect x="1036" y="180" width="8" height="80"/><rect x="1166" y="176" width="8" height="84"/><rect x="1296" y="180" width="8" height="80"/><path d="M1000 260 V208 h340 V260z"/><path d="M1360 260 c 0 -60 10 -110 60 -160 l 20 8 c -40 50 -50 100 -50 152z"/><rect x="0" y="236" width="1440" height="24"/></g><circle cx="249" cy="88" r="9" fill="#E8A33D" opacity=".5"/></svg>`;

const logo = `<svg viewBox="0 0 224 166" style="width:100%;height:100%"><path d="M24 0h176a24 24 0 0 1 24 24v86a24 24 0 0 1-24 24h-96l-36 32v-32H24a24 24 0 0 1-24-24V24A24 24 0 0 1 24 0z" fill="#E63917"/><text x="112" y="98" text-anchor="middle" font-family="Osw" font-size="92" fill="#F4F1EA">QDN</text></svg>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Osw;src:url(data:font/ttf;base64,${font('Oswald-Bold.ttf')})}
@font-face{font-family:Arc;src:url(data:font/ttf;base64,${font('Archivo-ExtraBold.ttf')})}
html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:#12233b}
.scene{position:absolute;inset:0;opacity:0}
.abs{position:absolute}
.osw{font-family:Osw;line-height:.92;letter-spacing:-.01em}
.arc{font-family:Arc}
.bone{color:#F4F1EA}.navy{color:#12233b}.red{color:#E63917}.gold{color:#E8A33D}
.bg-navy{background:#12233b}.bg-red{background:#E63917}.bg-bone{background:#F4F1EA}.bg-gold{background:#E8A33D}
.bubble{position:absolute;left:90px;top:560px;width:900px;height:620px;background:#E63917;border-radius:60px}
.bubble:after{content:"";position:absolute;left:150px;bottom:-70px;border-left:80px solid transparent;border-top:75px solid #E63917}
.ill{position:absolute;left:0;right:0;bottom:0;height:900px;overflow:hidden}
.ill svg{width:100%;height:100%}
.star{position:absolute;width:5px;height:5px;border-radius:50%;background:#fff}
.pill{position:absolute;left:50%;transform:translateX(-50%);white-space:nowrap;padding:34px 70px;border-radius:999px;background:#F4F1EA;color:#12233b;font-family:Arc;font-size:56px;letter-spacing:.12em}
</style></head><body>

<div class="scene bg-navy" id="sA">
  ${[[120,180],[300,420],[720,240],[930,520],[180,900],[880,1500],[420,1700],[980,1250],[60,1400]].map(p=>`<i class="star" style="left:${p[0]}px;top:${p[1]}px"></i>`).join('')}
  <div class="bubble" id="bub">
    <div class="abs osw bone" id="a1" style="left:70px;top:110px;font-size:190px">QUOI<br>D'NEUF,</div>
    <div class="abs osw gold" id="a2" style="left:70px;top:470px;font-size:130px">MONTRÉAL ?</div>
  </div>
  <div class="abs arc gold" id="a3" style="left:0;right:0;top:1330px;text-align:center;font-size:40px;letter-spacing:.3em">EN DIRECT DE MONTRÉAL</div>
</div>

${[["L'ACTU",'bg-red','bone','cone'],['LES TENDANCES','bg-navy','bone','metro'],['LES SORTIES','bg-gold','navy','houses'],['LA BOUFFE','bg-bone','navy','bagel']].map((s,i)=>`
<div class="scene ${s[1]}" id="sB${i}">
  <div class="ill" id="ill${i}">${ART[s[3]].replace('preserveAspectRatio="xMidYMid slice"','preserveAspectRatio="xMidYMid slice"')}</div>
  <div class="abs osw ${s[2]}" id="w${i}" style="left:80px;right:80px;top:380px;font-size:${s[0].length>10?190:250}px">${s[0]}</div>
</div>`).join('')}

<div class="scene bg-navy" id="sC">
  <div id="sky" class="abs" style="left:0;right:0;bottom:0;height:420px">${skyline}</div>
  <div class="abs osw bone" id="c1" style="left:80px;top:420px;font-size:200px">UNE VIDÉO<br>PAR JOUR.</div>
  <div class="abs osw red" id="c2" style="left:80px;top:900px;font-size:330px"><span id="num">60</span><span style="font-size:140px;color:#E8A33D"> SEC</span></div>
</div>

<div class="scene bg-bone" id="sD">
  <div class="abs osw red" id="d1" style="left:80px;right:80px;top:700px;font-size:300px">C'EST<br>OUVERT.</div>
</div>

<div class="scene bg-navy" id="sE">
  <div class="abs arc gold" style="left:0;right:0;top:300px;text-align:center;font-size:40px;letter-spacing:.3em">QUOI D'NEUF, MONTRÉAL ?</div>
  <div class="abs" id="e1" style="left:240px;top:520px;width:600px;height:445px">${logo}</div>
  <div class="abs osw bone" id="e2" style="left:0;right:0;top:1060px;text-align:center;font-size:120px">@quoidneufmtl</div>
  <div class="pill" id="e3" style="top:1300px">ABONNE-TOI</div>
  <div class="abs arc bone" id="e4" style="left:0;right:0;top:1560px;text-align:center;font-size:36px;letter-spacing:.2em;opacity:.7">NOUVEAU SUR INSTAGRAM</div>
</div>

<script>
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const cubicOut=t=>1-Math.pow(1-t,3);
const back=t=>{const c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);};
const seg=(t,a,b)=>clamp((t-a)/(b-a),0,1);
function show(el,on){el.style.opacity=on?1:0;}
function pop(el,p){el.style.transform='scale('+(0.6+0.4*back(p))+')';el.style.opacity=p;}
function slideUp(el,p,dist){el.style.transform='translateY('+((1-cubicOut(p))*dist)+'px)';el.style.opacity=cubicOut(p);}

window.seek=function(t){
  document.querySelectorAll('.scene').forEach(s=>show(s,false));
  // A : 0 → 2.9
  if(t<2.9){show($('sA'),true);
    pop($('bub'),seg(t,0,.55));$('bub').style.transform+=' scale('+(1+0.03*seg(t,.6,2.9))+')';
    slideUp($('a1'),seg(t,.35,.9),60);slideUp($('a2'),seg(t,.7,1.25),60);
    $('a3').style.opacity=seg(t,1.4,1.9);return;}
  // B : 4 cartes de 0.85 s
  if(t<6.3){const i=Math.min(3,Math.floor((t-2.9)/.85));const lt=(t-2.9)-i*.85;show($('sB'+i),true);
    const w=$('w'+i);const p=seg(lt,0,.3);w.style.transform='scale('+(1.5-0.5*cubicOut(p))+')';w.style.opacity=p;
    const ill=$('ill'+i);ill.style.transform='translateY('+((1-cubicOut(seg(lt,.05,.5)))*400)+'px)';ill.style.opacity=seg(lt,.05,.4);return;}
  // C : 6.3 → 9.4
  if(t<9.4){show($('sC'),true);const lt=t-6.3;
    $('sky').style.transform='translateY('+((1-cubicOut(seg(lt,0,1)))*420)+'px)';
    slideUp($('c1'),seg(lt,.1,.6),80);
    const p=seg(lt,.9,1.4);$('c2').style.opacity=p;$('num').textContent=Math.round(60*cubicOut(seg(lt,.9,2.0)));
    return;}
  // D : 9.4 → 10.6
  if(t<10.6){show($('sD'),true);const p=seg(t,9.4,9.7);$('d1').style.transform='scale('+(1.6-0.6*back(p))+')';$('d1').style.opacity=p;return;}
  // E : 10.6 → fin
  show($('sE'),true);const lt=t-10.6;
  pop($('e1'),seg(lt,0,.5));slideUp($('e2'),seg(lt,.3,.8),50);
  const pu=1+0.04*Math.sin((lt-.8)*6);$('e3').style.opacity=seg(lt,.7,1.0);$('e3').style.transform='translateX(-50%) scale('+(lt>.8?pu:1)+')';
  $('e4').style.opacity=.7*seg(lt,1.0,1.4);
};
seek(0);
</script></body></html>`;

async function main() {
  let pw;
  try { pw = require('playwright-core'); } catch (e) { console.error('Il faut playwright-core : npm i -D playwright-core'); process.exit(1); }
  const chrome = findChrome();
  if (!chrome) { console.error('Aucun Chromium trouvé (CHROME_PATH).'); process.exit(1); }
  fs.rmSync(FRAMES, { recursive: true, force: true }); fs.mkdirSync(FRAMES, { recursive: true });
  const page_html = path.join(OUT, 'bande-annonce.html'); fs.writeFileSync(page_html, html);

  const browser = await pw.chromium.launch({ executablePath: chrome, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.goto('file://' + page_html);
  await page.evaluate(() => document.fonts.ready);
  const total = DURATION * FPS;
  for (let i = 0; i < total; i++) {
    await page.evaluate((t) => window.seek(t), i / FPS);
    await page.screenshot({ path: path.join(FRAMES, `f${String(i).padStart(4, '0')}.png`), type: 'png' });
    if (i % FPS === 0) process.stdout.write(`\r  images : ${i}/${total}`);
  }
  await browser.close();
  process.stdout.write(`\r  images : ${total}/${total}\n`);

  const ff = findFfmpeg();
  const input = ['-y', '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%04d.png')];
  const mp4 = path.join(OUT, 'bande-annonce.mp4');
  try {
    execFileSync(ff, [...input, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart', mp4], { stdio: 'ignore' });
    console.log(`✔ ${path.relative(ROOT, mp4)}`);
  } catch (e) {
    const webm = path.join(OUT, 'bande-annonce.webm');
    execFileSync(ff, [...input, '-c:v', 'libvpx', '-b:v', '4M', '-pix_fmt', 'yuv420p', webm], { stdio: 'ignore' });
    console.log(`✔ ${path.relative(ROOT, webm)} (ffmpeg sans H.264 ici ; convertissez en MP4 si Instagram le demande)`);
  }
  fs.rmSync(FRAMES, { recursive: true, force: true });
}

main().catch((e) => { console.error('✘', e.message); process.exit(1); });
