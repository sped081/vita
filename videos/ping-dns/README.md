# Ping — épisode DNS

Vidéo animée verticale (TikTok, Reels, Shorts) de la série *Une minute pour comprendre l'informatique*, avec la mascotte Ping.

| Fichier | Rôle |
|---|---|
| `episode-dns-sans-voix.mp4` | La vidéo (60 images/s), avec musique, bruitages et sous-titres, sans voix. |
| `episode-dns.mp4` | Créée seulement quand `voix/` contient la voix : la même vidéo, avec la voix et la bouche de Ping synchronisée. |
| `episode-dns.srt` | Les sous-titres (déjà incrustés dans la vidéo). |
| `script.md` | Le texte à lire, réplique par réplique, avec le minutage. |
| `episode.html` | L'animation : chaque image est dessinée par `renderAt(t)`. On peut l'ouvrir dans un navigateur. |
| `voix.json` | Le texte de chaque réplique et son temps de départ. |
| `render.js` | Filme l'animation à 60 images/s, génère la musique et les bruitages, pose la voix, puis monte les MP4. |

## Refaire la vidéo

Il faut Node, `playwright-core` (avec un Chromium) et `ffmpeg`.

Pour la voix, mets une réplique par fichier dans `voix/` : `01.mp3`, `02.mp3`… dans l'ordre de `voix.json` (ElevenLabs, CapCut ou ta propre voix). Chaque fichier est posé à son temps, accéléré un peu s'il déborde, et la bouche de Ping suit le volume.

```bash
node render.js                       # écrit les deux MP4 (environ 2 minutes)
node render.js --peek 12,28,60       # captures de contrôle dans peek/
```

## La signature de la série

Ce qui distingue ces vidéos :

1. Ping est un personnage animé : bras articulés, bouche qui parle, yeux qui suivent l'action, sauts.
2. La barre de chapitres en haut montre où on est dans l'histoire.
3. Chaque épisode finit par « Essaie-le » : la vraie commande à taper (`nslookup`, `ping`, `tracert`…), pour que la personne voie le concept sur sa propre machine.
4. Un running gag : « C'est toujours le DNS ».
5. Le prochain épisode est annoncé à la fin.
