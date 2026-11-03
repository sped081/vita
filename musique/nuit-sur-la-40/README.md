# Nuit sur la 40 : beat drill style 514

140 BPM, fa mineur, boucle de 8 mesures : Fm, D♭, B♭m, C (2 mesures chacun).

| Fichier | Contenu | Dans FL Studio |
|---|---|---|
| `apercu.mp3` | Aperçu : 8 mesures d'intro (mélodie et accords), puis 8 mesures complètes | Pour écouter |
| `00-beat-complet.mid` | Les 4 pistes ensemble | File → Import → MIDI file |
| `01-batterie.mid` | Kick, snare, clap, charleys avec roulements, rim | Glisse sur FPC (notes General MIDI) |
| `02-808.mid` | 808 avec glissés (les notes qui se chevauchent glissent) | Sur un sample de 808, active « Porta » (glissé) |
| `03-accords.mid` | Nappe d'accords | Sur FLEX ou FL Keys, son « pad » ou « strings » |
| `04-melodie.mid` | Mélodie cloche ou piano | Sur FLEX (cloche) ou FL Keys |

Pour refaire les fichiers : `python3 generer.py` (demande numpy et ffmpeg).
