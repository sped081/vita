#!/usr/bin/env node
// Génère le site statique dans dist/ à partir de content/ et src/.
// Aucune dépendance : Node 18+ suffit.
'use strict';
const fs = require('fs');
const path = require('path');
const ART = require('./lib/illustrations');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const write = (p, s) => { const f = path.join(DIST, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };

const site = JSON.parse(read('content/site.json'));
const articles = JSON.parse(read('content/articles.json'));
const css = read('src/base.css');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function validate() {
  const ids = new Set();
  const cats = new Set(site.categories.map((c) => c.id));
  for (const a of articles) {
    for (const k of ['id', 'category', 'label', 'illustration', 'readingMinutes', 'title', 'summary', 'body']) {
      if (a[k] === undefined) throw new Error(`Article "${a.id || '?'}" : champ manquant "${k}"`);
    }
    if (ids.has(a.id)) throw new Error(`Identifiant en double : ${a.id}`);
    ids.add(a.id);
    if (!/^[a-z0-9-]+$/.test(a.id)) throw new Error(`Identifiant invalide "${a.id}" (lettres minuscules, chiffres, tirets)`);
    if (!cats.has(a.category)) throw new Error(`Article "${a.id}" : rubrique inconnue "${a.category}"`);
    if (!ART[a.illustration]) throw new Error(`Article "${a.id}" : illustration inconnue "${a.illustration}" (disponibles : ${Object.keys(ART).join(', ')})`);
  }
}

// Remplit les {{clés}} d'un modèle. Les valeurs sont déjà du HTML sûr.
function fill(tpl, vars) {
  return tpl.replace(/\{\{([\w.]+)\}\}/g, (m, key) => {
    const v = key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), vars);
    if (v === undefined) throw new Error(`Variable de modèle inconnue : ${key}`);
    return v;
  });
}

function renderBody(blocks) {
  return blocks.map((b) => {
    if (b.type === 'heading') return `<h2>${esc(b.text)}</h2>`;
    if (b.type === 'list') return `<ul>${b.items.map((li) => `<li>${esc(li)}</li>`).join('')}</ul>`;
    return `<p>${esc(b.text)}</p>`;
  }).join('\n');
}

// Format compact consommé par le lecteur intégré de la page d'accueil.
function clientData() {
  const A = articles.map((a) => ({
    id: a.id, cat: a.category, art: a.illustration, label: a.label, min: a.readingMinutes, t: a.title, d: a.summary,
    b: a.body.map((b) => (b.type === 'list' ? ['ul', b.items] : [b.type === 'heading' ? 'h2' : 'p', b.text])),
  }));
  return `var ART=${JSON.stringify(ART)};\n  var A=${JSON.stringify(A)};`;
}

function build() {
  validate();
  fs.rmSync(DIST, { recursive: true, force: true });
  const siteVars = { ...site, description: esc(site.description), name: esc(site.name) };

  // Accueil
  let index = read('src/index.html');
  index = index.replace('/*__DATA__*/', clientData());
  write('index.html', fill(index, { css, site: siteVars }));

  // Une page par article
  const tpl = read('src/article.html');
  for (const a of articles) {
    const jsonld = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.summary,
      inLanguage: site.language, author: { '@type': 'Organization', name: site.name },
      publisher: { '@type': 'Organization', name: site.name }, mainEntityOfPage: `${site.url}/articles/${a.id}.html`,
    });
    write(`articles/${a.id}.html`, fill(tpl, {
      css, site: siteVars, id: a.id, title: esc(a.title), summary: esc(a.summary), label: esc(a.label),
      readingMinutes: a.readingMinutes, art: ART[a.illustration], body: renderBody(a.body), jsonld,
    }));
  }

  // Images publiées avec le site
  fs.cpSync(path.join(ROOT, 'img'), path.join(DIST, 'img'), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'img', '01-bienvenue.png'), path.join(DIST, 'img', 'og.png'));

  // Favicon (le logo bulle), sitemap, robots, 404
  write('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 224 166"><path d="M24 0h176a24 24 0 0 1 24 24v86a24 24 0 0 1-24 24h-96l-36 32v-32H24a24 24 0 0 1-24-24V24A24 24 0 0 1 24 0z" fill="#E63917"/><text x="112" y="98" text-anchor="middle" font-family="Oswald,Impact,sans-serif" font-weight="700" font-size="92" fill="#F4F1EA">QDN</text></svg>\n`);
  const urls = [`${site.url}/`, ...articles.map((a) => `${site.url}/articles/${a.id}.html`)];
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
  write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
  write('404.html', fill(read('src/404.html'), { css, site: siteVars }));
  write('.nojekyll', '');

  console.log(`✔ Site généré dans dist/ : accueil, ${articles.length} articles, sitemap, favicon.`);
}

try { build(); } catch (e) { console.error(`✘ Build échoué : ${e.message}`); process.exit(1); }
