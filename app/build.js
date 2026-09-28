// Construit l'app Ma Session (dossier www/) à partir de la page etudes/ma-session.html.
// La même page sert trois fois : l'artefact claude.ai, la version web (PWA) et l'app iPhone.
//
//   node build.js          construit www/
//   node build.js --check  construit puis vérifie le résultat (utilisé par la CI)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Courriel affiché dans la page d'aide et la politique de confidentialité.
// Apple exige un moyen de contact : remplacez-le avant d'envoyer l'app.
const CONTACT = process.env.MS_CONTACT || 'votre-courriel@exemple.com';

const here = __dirname;
const root = path.join(here, '..');
const www = path.join(here, 'www');
const pkg = require('./package.json');
const check = process.argv.includes('--check');

function fail(msg) { console.error('✗ ' + msg); process.exit(1); }
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const f of fs.readdirSync(from)) {
    const a = path.join(from, f), b = path.join(to, f);
    if (fs.statSync(a).isDirectory()) copyDir(a, b); else fs.copyFileSync(a, b);
  }
}

// 1. La page, avec les polices embarquées au lieu de Google Fonts (l'app marche hors ligne).
let page = fs.readFileSync(path.join(root, 'etudes', 'ma-session.html'), 'utf8');
page = page
  .replace(/<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com"[^>]*>\s*/, '')
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link rel="stylesheet" href="fonts/fonts.css">');
if (/https?:\/\//.test(page)) fail('la page charge encore une ressource externe : ' + page.match(/https?:\/\/[^"' )]+/)[0]);
const cut = page.indexOf('</style>');
if (cut < 0 || !page.startsWith('<title>')) fail('structure inattendue de etudes/ma-session.html');
const headPart = page.slice(0, cut + '</style>'.length);
const bodyPart = page.slice(cut + '</style>'.length);

const index = `<!doctype html>
<html lang="fr-CA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="L'organiseur d'études des cégépiens : horaire, notes, cote R, plan d'étude, fiches et mode Focus.">
<meta name="theme-color" content="#090C13">
<meta name="color-scheme" content="dark">
<meta name="format-detection" content="telephone=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Ma Session">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" href="icons/icon-64.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<script>window.MS_VERSION=${JSON.stringify(pkg.version)};window.MS_PRIVACY_URL='confidentialite.html';window.MS_HELP_URL='aide.html';</script>
${headPart}
</head>
<body>${bodyPart}
<script>if('serviceWorker' in navigator&&location.protocol==='https:'&&!window.Capacitor){navigator.serviceWorker.register('sw.js').catch(function(){});}</script>
</body>
</html>
`;

// 2. Le dossier www/
fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });
fs.writeFileSync(path.join(www, 'index.html'), index);
copyDir(path.join(here, 'assets', 'fonts'), path.join(www, 'fonts'));
fs.mkdirSync(path.join(www, 'icons'), { recursive: true });
for (const f of ['icon-64.png', 'icon-192.png', 'icon-512.png', 'maskable-512.png', 'apple-touch-icon.png']) {
  fs.copyFileSync(path.join(here, 'assets', 'icons', f), path.join(www, 'icons', f));
}
for (const f of fs.readdirSync(path.join(here, 'pages'))) {
  const html = fs.readFileSync(path.join(here, 'pages', f), 'utf8').replace(/\{\{CONTACT\}\}/g, CONTACT).replace(/\{\{VERSION\}\}/g, pkg.version);
  fs.writeFileSync(path.join(www, f), html);
}
fs.writeFileSync(path.join(www, 'manifest.webmanifest'), JSON.stringify({
  name: 'Ma Session',
  short_name: 'Ma Session',
  description: "L'organiseur d'études des cégépiens.",
  lang: 'fr-CA',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#090C13',
  theme_color: '#090C13',
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2));

// 3. Le service worker de la version web : tout est mis en cache pour fonctionner hors ligne.
function list(dir, base = '') {
  return fs.readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f), rel = base ? base + '/' + f : f;
    return fs.statSync(p).isDirectory() ? list(p, rel) : [rel];
  });
}
const files = list(www).filter((f) => f !== 'sw.js' && !f.endsWith('.txt'));
const hash = crypto.createHash('sha256');
for (const f of files.sort()) hash.update(f).update(fs.readFileSync(path.join(www, f)));
const cacheName = 'ma-session-' + pkg.version + '-' + hash.digest('hex').slice(0, 10);
fs.writeFileSync(path.join(www, 'sw.js'), `// Généré par app/build.js
const CACHE=${JSON.stringify(cacheName)};
const FILES=${JSON.stringify(['./', ...files])};
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  if(e.request.mode==='navigate'){ // la page : le réseau d'abord pour recevoir les mises à jour
    e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r;}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./'))));return;}
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
`);

console.log('✓ www/ construit (' + files.length + ' fichiers, cache ' + cacheName + ')');

// 4. Vérifications
if (check) {
  const html = fs.readFileSync(path.join(www, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  scripts.forEach((js, i) => { try { new Function(js); } catch (e) { fail('script ' + i + ' invalide : ' + e.message); } });
  for (const ref of [...html.matchAll(/(?:href|src)="([^"#:'+]+)"/g)].map((m) => m[1])) {
    if (!fs.existsSync(path.join(www, ref))) fail('fichier manquant : ' + ref);
  }
  const fontsCss = fs.readFileSync(path.join(www, 'fonts', 'fonts.css'), 'utf8');
  for (const ref of [...fontsCss.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1])) {
    if (!fs.existsSync(path.join(www, 'fonts', ref))) fail('police manquante : ' + ref);
  }
  if (CONTACT.endsWith('@exemple.com')) console.warn('⚠ Courriel de contact à remplacer (variable MS_CONTACT ou constante CONTACT dans app/build.js).');
  console.log('✓ vérifications réussies (' + scripts.length + ' scripts)');
}
