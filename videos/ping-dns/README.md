# Ping — épisode DNS

Vidéo animée verticale (TikTok, Reels, Shorts) de la série *Une minute pour comprendre l'informatique*, avec la mascotte Ping.

| Fichier | Rôle |
|---|---|
| `episode-dns.mp4` | La vidéo finale, avec la voix robot de Ping, la musique et les bruitages. |
| `episode-dns-sans-voix.mp4` | La même, sans voix, pour enregistrer ta propre voix dans CapCut. |
| `episode-dns.srt` | Les sous-titres (déjà incrustés dans la vidéo). |
| `script.md` | Le texte à lire, réplique par réplique, avec le minutage. |
| `episode.html` | L'animation : chaque image est dessinée par `renderAt(t)`. On peut l'ouvrir dans un navigateur. |
| `voix.json` | Le texte de la voix de Ping, écrit comme il se prononce (« dé-ène-èsse »). |
| `render.js` | Filme l'animation à 30 images/s, synthétise la voix, la musique et les bruitages, puis monte les deux MP4. |

## Refaire la vidéo

Il faut Node, `playwright-core` (avec un Chromium), `ffmpeg`, et pour la voix `espeak-ng` et `mbrola-fr1`.

```bash
node render.js                       # écrit les deux MP4 (environ 2 minutes)
node render.js --peek 12,28,60       # captures de contrôle dans peek/
```

## La signature de la série

Ce qui distingue ces vidéos :

1. Ping est un robot du réseau. Sa voix est une voix de synthèse assumée.
2. La barre de chapitres en haut montre où on est dans l'histoire.
3. Chaque épisode finit par « Essaie-le » : la vraie commande à taper (`nslookup`, `ping`, `tracert`…), pour que la personne voie le concept sur sa propre machine.
4. Un running gag : « C'est toujours le DNS ».
5. Le prochain épisode est annoncé à la fin.
