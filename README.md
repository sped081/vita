# Quoi d'neuf MTL

Le site et les outils de contenu de **Quoi d'neuf MTL**, un média sur tout ce qui se passe à Montréal.
Le site est un site statique généré par un script Node, sans dépendance, et déployé automatiquement sur GitHub Pages.

En ligne : <https://sped081.github.io/vita/> · Instagram : [@quoidneufmtl](https://www.instagram.com/quoidneufmtl/)

## Structure

```
content/
  site.json         Nom, adresse du site, Instagram, rubriques
  articles.json     Les articles (le contenu du site)
src/
  index.html        Modèle de la page d'accueil
  article.html      Modèle d'une page d'article
  404.html          Page introuvable
  base.css          Feuille de style commune (injectée dans chaque page)
scripts/
  build.js          Génère le site dans dist/
  make-post.js      Génère une image Instagram (PNG 1080x1350)
  serve.js          Serveur local pour prévisualiser dist/
  lib/illustrations.js   Les illustrations vectorielles des articles
img/                Images publiées avec le site (posts Instagram)
brand/              Fichiers de marque : photo de profil, posts, couvertures
assets/fonts/       Polices utilisées par make-post.js (Oswald, Archivo — licence OFL)
.github/workflows/  Déploiement automatique
```

## Commandes

Il faut Node 18 ou plus. Aucune installation (`npm install`) n'est nécessaire.

| Commande | Effet |
|---|---|
| `npm run build` | Génère le site dans `dist/` (accueil, une page par article, sitemap, favicon, 404). |
| `npm run dev` | Génère le site et le sert sur <http://localhost:8080>. |
| `npm run check` | Ce que fait l'intégration continue : build + vérification de syntaxe des scripts. |
| `npm run post -- …` | Génère une image Instagram dans `out/` (voir plus bas). |

## Ajouter un article

1. Ouvrez `content/articles.json` et ajoutez une entrée :

```json
{
  "id": "igloofest",
  "category": "culture",
  "label": "Culture",
  "illustration": "cross",
  "readingMinutes": 3,
  "title": "Igloofest : le guide de survie au froid",
  "summary": "S'habiller, danser, survivre : tout pour affronter -20 °C en festival.",
  "body": [
    { "type": "paragraph", "text": "Chaque hiver, …" },
    { "type": "heading", "text": "Comment s'habiller" },
    { "type": "list", "items": ["Trois couches.", "Des bottes chaudes.", "Un thermos."] }
  ]
}
```

   - `id` : lettres minuscules, chiffres et tirets. Il devient l'adresse de la page (`articles/igloofest.html`).
   - `category` : une des rubriques de `content/site.json`.
   - `illustration` : `bagel`, `metro`, `cone`, `boxes`, `houses` ou `cross`. Pour en ajouter une, complétez `scripts/lib/illustrations.js`.
   - Le premier article de la liste est celui mis en avant sur la page d'accueil.

2. Lancez `npm run build`. Le build refuse un article incomplet ou une rubrique inconnue et explique pourquoi.
3. Commitez et poussez : le site se met à jour tout seul.

## Générer une image Instagram

```bash
npm run post -- debat "ST-VIATEUR" "FAIRMOUNT" "Le meilleur bagel, c'est lequel ?"
npm run post -- annonce "Nouvelle vidéo" "Bixi contre métro : la course" "Ce soir, 18 h"
npm run post -- liste "5 affaires de Montréalais" "Les cônes orange" "Le 1er juillet" "Les escaliers"
```

Trois modèles : `debat` (A contre B), `annonce` (accroche, titre, sous-titre) et `liste` (titre puis jusqu'à 7 éléments).
Le PNG est écrit dans `out/`. Il faut Chrome ou Chromium sur la machine ; au besoin, indiquez son chemin avec `CHROME_PATH=/chemin/vers/chrome`.

## Déploiement

À chaque `git push` sur `main` (ou sur la branche de travail), GitHub Actions lance `npm run check`, puis publie `dist/` sur GitHub Pages.
Les pull requests sont construites mais pas mises en ligne.

Une seule chose à faire une fois, dans le dépôt GitHub : **Settings → Pages → Source : GitHub Actions**.

## Modifier le site

- Le nom, la description, l'adresse et les rubriques : `content/site.json`.
- Les couleurs et la typographie : les variables en tête de `src/base.css`.
- La page d'accueil : `src/index.html`. La ligne `/*__DATA__*/` est remplacée par les articles au build.

## Générer la bande-annonce (vidéo)

```bash
npm install          # une seule fois : installe playwright-core et ffmpeg-static
npm run trailer      # → out/bande-annonce.mp4 (1080x1920, 13 s, H.264)
```

Les scènes sont décrites dans `scripts/make-trailer.js` : une page HTML dessine l'image correspondant à chaque instant,
Playwright capture les 390 images, ffmpeg les assemble. Modifiez les textes ou la durée dans ce fichier, puis relancez.
Instagram ajoute la musique : au moment de publier le Reel, choisissez un son en tendance.

## Ma Session (organiseur d'études et app iPhone)

- `etudes/ma-session.html` : l'app elle-même, une seule page (horaire, notes, cote R, oracle, fiches, mode Focus).
- `app/` : la même page emballée pour l'iPhone avec Capacitor, prête pour l'App Store. Marche à suivre complète dans [`app/README.md`](app/README.md).
- Le déploiement GitHub Pages publie aussi la version web installable dans `ma-session/`.
