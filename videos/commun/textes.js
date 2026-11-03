// Écrit le script à lire (script.md) et les sous-titres (<OUTPUT>.srt) d'une page de vidéo de la série.
// Usage : node commun/textes.js intro/intro.html
const fs = require('fs');
const path = require('path');
const html = path.resolve(process.argv[2]);
const src = fs.readFileSync(html, 'utf8');
const grab = (name) => Function(`return ${src.match(new RegExp(`const ${name}=(\\[[\\s\\S]*?\\n?\\]);`))[1]}`)();
const CAPTIONS = grab('CAPTIONS'), CHAPTERS = grab('CHAPTERS');
const DUR = Number(src.match(/const DURATION=([\d.]+)/)[1]);
const OUT = src.match(/window\.OUTPUT='([^']+)'/)[1];
const title = src.match(/<title>(.*?)<\/title>/)[1];
const ts = (x) => { const ms = Math.round(x * 1000); const p = (n, l = 2) => String(n).padStart(l, '0'); return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`; };
const mmss = (x) => `${Math.floor(x / 60)}:${(x % 60).toFixed(1).padStart(4, '0')}`;
fs.writeFileSync(path.join(path.dirname(html), `${OUT}.srt`), CAPTIONS.map(([a, b, t], i) => `${i + 1}\n${ts(a)} --> ${ts(b)}\n${t}\n`).join('\n'));
let md = `# ${title.replace(/^[^—]+ — /, '')}\n\nAvec Diego. Durée : ${DUR} s, format vertical 1080 × 1920.\n\n` +
  `Pour la voix : une réplique par fichier, dans l'ordre (01, 02…), à mettre dans \`voix/\`. Les sous-titres sont déjà dans la vidéo.\n`;
let n = 0;
CHAPTERS.forEach(([t0, name], i) => {
  const t1 = i + 1 < CHAPTERS.length ? CHAPTERS[i + 1][0] : DUR;
  md += `\n## ${mmss(t0)} — ${name}\n\n| N° | Temps | Réplique |\n|---|---|---|\n`;
  for (const [a, , t] of CAPTIONS) if (a >= t0 && a < t1) md += `| ${String(++n).padStart(2, '0')} | ${mmss(a)} | ${t} |\n`;
});
fs.writeFileSync(path.join(path.dirname(html), 'script.md'), md);
console.log('écrit script.md et', `${OUT}.srt`);
