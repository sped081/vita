# Vidéos de Diego

Série verticale (Instagram Reels, TikTok, Shorts) *Une minute pour comprendre l'informatique*, avec Diego, l'animateur.

| Dossier | Vidéo |
|---|---|
| `intro/` | Présentation de la chaîne (31 s) : qui est Diego, son outil préféré (`ping`), ce que la série explique. |
| `ep01-dns/` | Épisode 1 : C'est quoi réellement le DNS ? (65 s). |
| `commun/` | Ce que toutes les vidéos partagent : les personnages animés (`diego.js`, `rezo.js`, et Ping dans `base.js`), les polices, les styles, le rendu. |

Chaque dossier de vidéo contient :

| Fichier | Rôle |
|---|---|
| `*.html` | L'animation. Chaque image est dessinée par `renderAt(t)` ; la page s'ouvre aussi dans un navigateur. |
| `*-sans-voix.mp4` | La vidéo rendue (60 images/s), avec musique, bruitages et sous-titres, sans voix. |
| `script.md` | Le texte à lire, réplique par réplique, numéroté, avec le minutage. |
| `*.srt` | Les sous-titres (déjà incrustés dans la vidéo). |
| `voix.json` | Le temps de départ de chaque réplique, utilisé pour poser la voix. |

## Rendre une vidéo

Il faut Node, `playwright-core` (avec un Chromium) et `ffmpeg`. Depuis ce dossier :

```bash
node commun/render.js intro/intro.html                 # écrit le MP4 (2 à 3 minutes)
node commun/render.js intro/intro.html --peek 2,10,20  # captures de contrôle dans intro/peek/
node commun/textes.js intro/intro.html                 # refait script.md et le .srt
```

## Ajouter la voix

Mets une réplique par fichier dans le dossier `voix/` de la vidéo : `01.mp3`, `02.mp3`… dans l'ordre de `script.md` (ElevenLabs, CapCut ou ta propre voix), puis relance le rendu. Chaque réplique est posée à son temps, accélérée un peu si elle déborde, et la bouche de Diego suit le volume de la voix. Le rendu écrit alors aussi la version avec voix (`intro-diego.mp4`, `episode-dns.mp4`).

## Faire un nouvel épisode

Copie une page existante et change :
- les scènes, c'est-à-dire le HTML dans `#stage` et leurs `show(...)` dans `renderAt` ;
- `CAPTIONS`, `CHAPTERS`, `DURATION`, `OUTPUT` ;
- `HERO` (`'diego'`, `'rezo'` ou `'ping'`) et `POSE`, `JUMPS`, `EXPR`, c'est-à-dire ce que fait le personnage et quand ;
- `SHOTS`, les gros plans sur le visage : `[début, fin, zoom]` ;
- `EVENTS`, les bruitages.

Poses des bras : `rest`, `wave`, `point`, `side`, `shrug`, `cheer`, `hip`, `think`, `present`.
Expressions : `content`, `curious`, `happy`, `error`, `smirk`.

## La signature de la série

1. Diego est un personnage animé : bras articulés, bouche qui parle, yeux qui suivent l'action, clignements, sauts, cinq expressions.
2. La barre de chapitres en haut montre où on est dans l'histoire, et une bande de couleur balaie l'écran à chaque chapitre.
3. Chaque épisode finit par « Essaie-le » : la vraie commande à taper (`nslookup`, `ping`, `tracert`…).
4. Un running gag : « C'est toujours le DNS ».
6. Le décor : l'atelier, la nuit, avec vue sur Montréal (le mont Royal et sa croix).
7. Les gros plans (`SHOTS`) : la caméra zoome sur le visage de Diego pour les répliques drôles.
5. Le prochain épisode est annoncé à la fin.
