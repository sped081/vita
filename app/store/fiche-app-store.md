# Fiche App Store : Ma Session

Tout ce qu'il faut copier dans **App Store Connect**. Les limites de caractères sont respectées.

## Informations de l'app

| Champ | Valeur |
|---|---|
| Nom (30 max) | `Ma Session : études au cégep` (28) |
| Sous-titre (30 max) | `Horaire, notes, cote R, focus` (29) |
| Langue principale | Français (Canada) |
| Identifiant de lot (Bundle ID) | `com.sped081.masession` |
| SKU | `MASESSION001` |
| Catégorie principale | Éducation |
| Catégorie secondaire | Productivité |
| Prix | Gratuit |
| Disponibilité | Canada (voir la note plus bas) |
| URL de la politique de confidentialité | https://sped081.github.io/vita/ma-session/confidentialite.html |
| URL d'assistance | https://sped081.github.io/vita/ma-session/aide.html |
| URL marketing (facultatif) | https://sped081.github.io/vita/ma-session/ |
| Droits d'auteur | `2026 [votre nom]` |

Si le nom est déjà pris, essayez : `Ma Session : cote R et études`, `Ma Session – Cégep`.

> **Disponibilité :** commencez par le Canada seulement. Pour publier dans l'Union européenne, Apple exige en plus de déclarer un statut de « commerçant » (DSA) avec une adresse et un téléphone publics.

## Texte promotionnel (170 max)

```
Nouveau : votre cote R estimée en direct, et une étoile dorée dans votre ciel pour chaque séance d'étude terminée.
```

## Mots-clés (100 max)

Les mots du nom et du sous-titre sont déjà indexés : inutile de les répéter.

```
étude,examen,moyenne,révision,fiches,pomodoro,étudiant,agenda,collège,cours,devoirs,bulletin
```

## Description (4 000 max)

```
Ma Session organise votre session au cégep, de la première semaine jusqu'au dernier examen.

VOTRE SESSION, D'UN COUP D'ŒIL
• Votre horaire de la semaine, vos cours et vos laboratoires.
• Le compte à rebours jusqu'à votre prochain examen.
• Vos moyennes par cours, calculées selon la pondération de chaque évaluation.

VOTRE COTE R, ESTIMÉE EN DIRECT
Entrez la moyenne et l'écart-type de votre groupe : Ma Session estime votre cote R avec la formule du BCI, par cours et pour toute la session. Elle vous montre aussi le cours où chaque point de pourcentage fait le plus grimper votre cote R. Fixez-vous un objectif (celui de votre programme universitaire, par exemple) et suivez l'écart.

L'ORACLE DE FIN DE SESSION
Pour chaque cours, Ma Session simule 3 000 fins de session à partir de vos notes et vous donne vos chances d'atteindre votre note visée. Il vous dit aussi où un effort de 5 points change le plus vos chances.

UN PLAN D'ÉTUDE QUI SE FAIT TOUT SEUL
Ajoutez vos évaluations : Ma Session répartit des séances de 45 minutes avant chacune, plus nombreuses quand l'évaluation compte beaucoup et plus serrées à l'approche de la date. Le relief de votre session vous montre vos semaines les plus chargées, comme une chaîne de montagnes.

DES FICHES QUI SE GLISSENT
Écrivez vos notes de cours. Chaque ligne « Question :: Réponse » devient une fiche. Touchez pour la retourner, glissez à droite si vous saviez, à gauche sinon. Vos fiches forment une constellation : chaque étoile pâlit à mesure que vous l'oubliez, selon la courbe de l'oubli, et se rallume quand vous la révisez.

UN MODE FOCUS QUI RESPIRE
Minuteur de 15, 25 ou 45 minutes, sphère qui respire avec vous, sons de pluie ou bruit doux. Chaque séance terminée allume une étoile dorée dans le ciel de l'accueil. Étudiez un peu chaque jour pour allonger votre série.

PRIVÉE PAR DÉFAUT
Pas de compte, pas de publicité, pas de serveur. Tout reste sur votre téléphone et l'app fonctionne hors ligne. Une sauvegarde en un geste vous permet de changer d'appareil.

La cote R affichée est une estimation : la cote officielle dépend aussi de la force et de la dispersion de votre groupe, calculées en fin de session.
```

## Nouveautés de cette version

```
Première version de Ma Session. Bonne session !
```

## Captures d'écran

Format iPhone 6,9 po (accepté pour tous les iPhone), 1290 × 2796 px, dans `store/screenshots/`, à envoyer dans cet ordre :

1. `01-accueil.png` : Toute votre session, d'un coup d'œil
2. `02-cote-r.png` : Votre cote R, estimée en direct
3. `03-oracle.png` : Vos chances de réussite, simulées
4. `04-fiches.png` : Des fiches qui se glissent
5. `05-focus.png` : Un mode Focus qui respire
6. `06-constellation.png` : Votre mémoire, en constellation

L'app est réglée pour l'iPhone seulement : aucune capture iPad n'est demandée.

## Confidentialité de l'app (« App Privacy »)

À la question « Collectez-vous des données à partir de cette app ? », répondez **Non**. L'étiquette affichée sera « Données non collectées ».

## Classification par âge

Répondez « Aucun » ou « Non » à toutes les questions (pas de violence, pas de contenu généré par d'autres utilisateurs, pas de navigateur web, pas d'achats). Résultat attendu : **4+**.

## Chiffrement (conformité à l'exportation)

Déjà réglé dans le projet (`ITSAppUsesNonExemptEncryption = NO`) : Xcode ne posera pas la question.

## Notes pour l'équipe d'examen d'Apple (« App Review »)

```
Aucun compte n'est nécessaire. À la première ouverture, l'app affiche une session d'exemple (4 cours, horaire, évaluations et fiches) pour montrer toutes les fonctions. Le bouton « Effacer l'exemple et commencer » repart de zéro.

À essayer :
- Accueil : ciel animé, cote R estimée et oracle de réussite.
- Onglet Fiches : « Réviser maintenant », touchez la carte puis glissez-la à droite ou à gauche.
- Onglet Accueil, carte « À réviser aujourd'hui » : ▶ lance le mode Focus (minuteur et sons générés).
- Bouton Réglages (en haut à droite) : prénom, sauvegarde, effacement des données, politique de confidentialité.

Toutes les données restent sur l'appareil ; l'app ne fait aucune requête réseau et fonctionne hors ligne.
```
