# Vidéos de Ping

Série verticale (TikTok, Reels, Shorts) *Une minute pour comprendre l'informatique*, avec la mascotte Ping.

| Dossier | Vidéo |
|---|---|
| `ping-intro/` | Présentation de la chaîne (31 s) : qui est Ping, d'où vient son nom, ce que la série explique. |
| `ping-dns/` | Épisode 1 : C'est quoi réellement le DNS ? (65 s). |
| `commun/` | Ce que toutes les vidéos partagent : le squelette animé de Ping, les polices, les styles, le rendu. |

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
node commun/render.js ping-intro/intro.html                 # écrit le MP4 (2 à 3 minutes)
node commun/render.js ping-intro/intro.html --peek 2,10,20  # captures de contrôle dans ping-intro/peek/
node commun/textes.js ping-intro/intro.html                 # refait script.md et le .srt
```

## Ajouter la voix

Mets une réplique par fichier dans le dossier `voix/` de la vidéo : `01.mp3`, `02.mp3`… dans l'ordre de `script.md` (ElevenLabs, CapCut ou ta propre voix), puis relance le rendu. Chaque réplique est posée à son temps, accélérée un peu si elle déborde, et la bouche de Ping suit le volume de la voix. Le rendu écrit alors aussi la version avec voix (`intro-ping.mp4`, `episode-dns.mp4`).

## Faire un nouvel épisode

Copie une page existante et change :
- les scènes, c'est-à-dire le HTML dans `#stage` et leurs `show(...)` dans `renderAt` ;
- `CAPTIONS`, `CHAPTERS`, `DURATION`, `OUTPUT` ;
- `POSE`, `JUMPS`, `EXPR`, c'est-à-dire ce que fait Ping et quand ;
- `EVENTS`, les bruitages.

Poses des bras : `rest`, `wave`, `point`, `side`, `shrug`, `cheer`, `hip`, `think`, `present`.
Expressions : `content`, `curious`, `happy`, `error`, `smirk`.

## La signature de la série

1. Ping est un personnage animé : bras articulés, bouche qui parle, yeux qui suivent l'action, sauts.
2. La barre de chapitres en haut montre où on est dans l'histoire.
3. Chaque épisode finit par « Essaie-le » : la vraie commande à taper (`nslookup`, `ping`, `tracert`…).
4. Un running gag : « C'est toujours le DNS ».
5. Le prochain épisode est annoncé à la fin.
