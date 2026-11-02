// Rend episode.html en vidéo verticale 1080 × 1920 (60 i/s) avec bruitages, musique et, si elle existe, la voix.
// Usage : node render.js                 -> episode-dns-sans-voix.mp4 (+ episode-dns.mp4 si voix/ contient la voix)
//         node render.js --peek 3,12,28  -> captures PNG de contrôle dans peek/
// La voix : une réplique par fichier dans voix/ (01.wav, 02.mp3…), dans l'ordre de voix.json.
// Chaque réplique est posée à son temps ; la bouche de Ping suit le volume de la voix.
// Demande playwright-core (CHROMIUM_PATH si besoin) et ffmpeg.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require(process.env.PW_MODULE || 'playwright-core');

const here = __dirname;
const W = 1080, H = 1920, FPS = 60, DUR = 65, SR = 48000;
const frames = path.join(here, '.frames');
const args = process.argv.slice(2);
const peek = args[0] === '--peek' ? args[1].split(',').map(Number) : null;

async function page(browser, mouth) {
  const p = await browser.newPage({ viewport: { width: W, height: H } });
  await p.goto('file://' + path.join(here, 'episode.html'));
  await p.evaluate(() => document.fonts.ready);
  if (mouth) await p.evaluate((m) => { window.MOUTH = m; }, mouth);
  return p;
}

// ---------- voix : une réplique par fichier dans voix/ ----------
function voice() {
  const dir = path.join(here, 'voix');
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => /^\d+\.(wav|mp3|m4a|ogg|flac)$/i.test(f)).sort((x, y) => parseInt(x) - parseInt(y));
  if (!files.length) return null;
  const lines = JSON.parse(fs.readFileSync(path.join(here, 'voix.json'), 'utf8'));
  return files.map((f) => {
    const i = parseInt(f) - 1, t = lines[i][0];
    const src = path.join(dir, f);
    // si la réplique déborde sur la suivante, on l'accélère un peu (au plus 25 %)
    const d = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src]));
    const room = (i + 1 < lines.length ? lines[i + 1][0] : DUR - 0.2) - t - 0.08;
    const fit = Math.min(1.25, Math.max(1, d / room));
    if (fit > 1) console.log(`réplique ${i + 1} accélérée ×${fit.toFixed(2)}`);
    const raw = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', src, '-af',
      `silenceremove=start_periods=1:start_threshold=-45dB,atempo=${fit.toFixed(4)},highpass=f=80`,
      '-f', 'f32le', '-ac', '1', '-ar', String(SR), '-'], { maxBuffer: 64 << 20 });
    return { t, s: new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4) };
  });
}
function voiceTrack(clips) {
  const n = SR * DUR, V = new Float32Array(n);
  let peak = 0; for (const c of clips) for (const v of c.s) peak = Math.max(peak, Math.abs(v));
  for (const c of clips) { const s0 = Math.floor(c.t * SR); for (let i = 0; i < c.s.length && s0 + i < n; i++) V[s0 + i] += c.s[i] * 0.9 / peak; }
  return V;
}
// ouverture de la bouche, une valeur par image : volume de la voix, lissé
function mouthFrom(V) {
  const per = SR / FPS, out = [];
  let m = 0;
  for (let f = 0; f < FPS * DUR; f++) {
    let e = 0; const a = Math.floor(f * per);
    for (let i = a; i < a + per && i < V.length; i++) e += V[i] * V[i];
    const v = Math.min(1, Math.sqrt(e / per) * 5.5);
    m += (v > m ? 0.7 : 0.35) * (v - m);
    out.push(+m.toFixed(3));
  }
  return out;
}

// ---------- audio : synthèse directe, échantillon par échantillon ----------
function audio(events, V) {
  const n = SR * DUR, L = new Float32Array(n), R = new Float32Array(n), mL = new Float32Array(n), mR = new Float32Array(n);
  V = V || new Float32Array(n);
  let tL = L, tR = R;
  const add = (t0, len, fn, gain = 1, pan = 0) => {
    const L = tL, R = tR;
    const s0 = Math.floor(t0 * SR), m = Math.floor(len * SR);
    for (let i = 0; i < m && s0 + i < n; i++) { const v = fn(i / SR) * gain; L[s0 + i] += v * (1 - pan); R[s0 + i] += v * (1 + pan); }
  };
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  const SFX = {
    pop: (t) => Math.sin(2 * Math.PI * (520 * t + 5200 * t * t)) * Math.exp(-t * 32),
    tick: (t) => rnd() * Math.exp(-t * 260) * 0.8 + Math.sin(2 * Math.PI * 2400 * t) * Math.exp(-t * 300) * 0.4,
    thud: (t) => Math.sin(2 * Math.PI * (95 * t - 60 * t * t)) * Math.exp(-t * 9) + rnd() * Math.exp(-t * 40) * 0.25,
    ding: (t) => (Math.sin(2 * Math.PI * 1320 * t) + 0.6 * Math.sin(2 * Math.PI * 1980 * t) + 0.25 * Math.sin(2 * Math.PI * 2640 * t)) * Math.exp(-t * 4.5) * 0.5,
    step: (t) => Math.sin(2 * Math.PI * (180 * t - 300 * t * t)) * Math.exp(-t * 45) + rnd() * Math.exp(-t * 90) * 0.3,
    boing: (t) => Math.sin(2 * Math.PI * (260 * t + 900 * t * t)) * Math.exp(-t * 7) * (1 + 0.3 * Math.sin(2 * Math.PI * 28 * t)),
  };
  const LEN = { pop: 0.14, tick: 0.04, thud: 0.6, ding: 1.1, step: 0.1, boing: 0.45 };
  const GAIN = { pop: 0.32, tick: 0.16, thud: 0.6, ding: 0.28, step: 0.25, boing: 0.22 };
  for (const e of events) {
    if (e.type === 'whoosh') {
      // bruit filtré dont la fréquence monte puis descend
      let lp = 0, lp2 = 0;
      add(e.t - 0.12, 0.55, (t) => { const x = t / 0.55, a = 0.03 + 0.22 * Math.sin(Math.PI * x); lp += a * (rnd() - lp); lp2 += a * (lp - lp2); return lp2 * Math.sin(Math.PI * x) * 3.2; }, 0.5);
    } else add(e.t, LEN[e.type], SFX[e.type], GAIN[e.type], e.type === 'tick' ? (rnd() * 0.3) : 0);
  }
  tL = mL; tR = mR;
  // musique de fond légère : 96 bpm, accords Do – La m – Fa – Sol, basse + nappe + charleston
  const bpm = 96, beat = 60 / bpm, bar = beat * 4;
  const chords = [[48, 60, 64, 67], [45, 57, 60, 64], [41, 57, 60, 65], [43, 55, 59, 62]];
  const f = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const end = DUR - 0.4;
  for (let b = 0; b * bar < end; b++) {
    const c = chords[b % 4], t0 = b * bar;
    for (let k = 1; k < 4; k++) add(t0, bar, (t) => { const env = Math.min(1, t / 0.25) * Math.min(1, (bar - t) / 0.3); return (Math.sin(2 * Math.PI * f(c[k]) * t) + 0.3 * Math.sin(4 * Math.PI * f(c[k]) * t)) * env; }, 0.022, (k - 2) * 0.35);
    for (let q = 0; q < 4; q++) {
      const tq = t0 + q * beat;
      add(tq, beat * 0.9, (t) => Math.sin(2 * Math.PI * f(c[0] - 12) * t) * Math.exp(-t * 3), 0.13);
      add(tq + beat / 2, 0.05, (t) => rnd() * Math.exp(-t * 120), 0.03, 0.3);
      if (q % 2 === 0) add(tq, 0.25, (t) => Math.sin(2 * Math.PI * (110 * t - 120 * t * t)) * Math.exp(-t * 18), 0.22);
    }
  }
  // voix : normalisée, et la musique baisse pendant qu'elle parle
  let env = 0;
  const att = 1 - Math.exp(-1 / (0.02 * SR)), rel = 1 - Math.exp(-1 / (0.35 * SR));
  for (let i = 0; i < n; i++) {
    const a = Math.abs(V[i]); env += (a > env ? att : rel) * (a - env);
    const duck = 1 - 0.6 * Math.min(1, env * 6);
    L[i] += mL[i] * duck + V[i]; R[i] += mR[i] * duck + V[i];
  }
  // fondu final + limiteur doux
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    const t = i / SR, fade = Math.min(1, (DUR - t) / 0.8);
    buf.writeInt16LE(Math.round(Math.tanh(L[i] * fade) * 30000), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.tanh(R[i] * fade) * 30000), 46 + i * 4);
  }
  return buf;
}

(async () => {
  fs.rmSync(frames, { recursive: true, force: true }); fs.mkdirSync(frames);
  const clips = voice();
  const V = clips ? voiceTrack(clips) : null;
  const mouth = V ? mouthFrom(V) : null;
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  if (peek) {
    const dir = path.join(here, 'peek'); fs.mkdirSync(dir, { recursive: true });
    const p = await page(browser, mouth);
    for (const t of peek) { await p.evaluate((t) => renderAt(t), t); await p.screenshot({ path: path.join(dir, `t${String(t).replace('.', '_')}.png`) }); }
    await browser.close(); fs.rmSync(frames, { recursive: true, force: true }); console.log('captures dans', dir); return;
  }
  const total = FPS * DUR, workers = 4;
  const pages = await Promise.all(Array.from({ length: workers }, () => page(browser, mouth)));
  const events = await pages[0].evaluate(() => window.EVENTS);
  let next = 0, done = 0;
  await Promise.all(pages.map(async (p) => {
    while (next < total) {
      const i = next++;
      await p.evaluate((t) => renderAt(t), i / FPS);
      await p.screenshot({ path: path.join(frames, `${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
      if (++done % 600 === 0) console.log(`${done}/${total} images`);
    }
  }));
  await browser.close();
  const vid = path.join(frames, 'video.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(frames, '%05d.jpg'),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', vid], { stdio: 'inherit' });
  const outs = [['episode-dns-sans-voix.mp4', null]];
  if (V) outs.unshift(['episode-dns.mp4', V]);
  for (const [name, v] of outs) {
    const wav = path.join(frames, 'audio.wav');
    fs.writeFileSync(wav, audio(events, v));
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', vid, '-i', wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
      '-movflags', '+faststart', '-shortest', path.join(here, name)], { stdio: 'inherit' });
    console.log('écrit', name);
  }
  fs.rmSync(frames, { recursive: true, force: true });
})().catch((e) => { console.error(e); process.exit(1); });
