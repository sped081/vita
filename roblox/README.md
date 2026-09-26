# Île des Bandits (Roblox)

Le système de combat de la démo web (`demo/ile-des-bandits.html`), écrit en Luau pour Roblox.
Mêmes règles, mêmes chiffres : combo de 3 coups, boule de feu, esquive, vagues de bandits, boss avec frappe au sol, niveaux et sauvegarde.

## Jouer tout de suite

1. Ouvrez `IleDesBandits.rbxlx` dans Roblox Studio (le fichier est généré par Rojo, voir plus bas).
2. Cliquez sur **Play**.

Pour que la sauvegarde fonctionne dans Studio : **Home → Game Settings → Security → Enable Studio Access to API Services**.
Sans ça, le jeu marche mais la progression n'est pas sauvegardée (un avertissement l'indique dans la sortie).

## Commandes

| Action | Clavier / souris | Manette | Mobile |
|---|---|---|---|
| Frapper (garder enfoncé pour enchaîner) | clic gauche, J | X | bouton Frapper |
| Boule de feu | K, Q | Y | bouton Feu |
| Esquive | L, E | B | bouton Esquive |

## Architecture

```
src/shared/     (ReplicatedStorage.Shared)
  CombatConfig    tous les réglages : dégâts, portées, recharges, vagues
  Remotes         crée ou récupère les RemoteEvents
src/server/     (ServerScriptService.Server)
  Main            démarre les trois services
  CombatService   attaques, boule de feu, esquive, dégâts : tout est décidé ici
  Waves           IA des bandits et du boss, enchaînement des vagues
  PlayerData      niveau, XP et pièces, sauvegardés avec DataStoreService
src/client/     (StarterPlayerScripts.Client)
  CombatInput     commandes (ContextActionService crée les boutons mobiles)
  CombatEffects   chiffres de dégâts, explosions, bannières
```

### Les choix importants

- **Le serveur fait autorité.** Le client envoie une intention (« je frappe »). Le serveur vérifie la recharge, choisit les cibles à partir de *sa* position du personnage et calcule les dégâts. Spammer les RemoteEvents ne sert à rien.
- **Un seul point d'entrée pour les dégâts** (`CombatService.damage`), utilisé par les joueurs et par les bandits. L'invincibilité de l'esquive, l'étiquette `creator` pour l'XP et le recul sont gérés au même endroit.
- **Une sauvegarde prudente.** Réessais avec délai croissant, `UpdateAsync`, sauvegarde automatique toutes les 2 minutes et à la fermeture du serveur. Si le chargement échoue, la session n'est *pas* sauvegardée, pour ne jamais écraser une vraie progression par des valeurs par défaut.
- **L'esquive est déplacée par le client**, parce que Roblox donne au client la physique de son personnage. Le serveur ne fait que valider la recharge et accorder l'invincibilité.

## Développer avec Rojo

```bash
rojo serve                                        # synchronise le code avec Studio (plugin Rojo)
rojo build default.project.json -o IleDesBandits.rbxlx   # génère le fichier de jeu
rojo sourcemap default.project.json -o sourcemap.json
luau-lsp analyze --definitions=globalTypes.d.luau --sourcemap=sourcemap.json src   # vérification des types
```

Tous les fichiers sont en `--!strict`. L'intégration continue (`.github/workflows/luau.yml`) construit le projet et vérifie les types à chaque push.

## Ce qui reste à faire pour un vrai jeu

- Des **animations** : mettez leurs identifiants dans `CombatConfig.Animations`.
- Un vrai **décor** (île, palmiers, rochers) et des **sons**.
- Un **anti-triche de déplacement** (vitesse, téléportation) : ce projet protège le combat, pas encore les déplacements.
