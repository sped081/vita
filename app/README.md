# Ma Session pour iPhone

L'app iPhone de Ma Session, construite avec [Capacitor](https://capacitorjs.com) à partir de la même page que la version web : `etudes/ma-session.html`.

```
app/
├── build.js                 construit www/ (la page + polices + icônes + pages légales)
├── capacitor.config.json    identifiant de l'app : com.sped081.masession
├── ios/                     projet Xcode (Swift Package Manager, pas de CocoaPods)
├── pages/                   politique de confidentialité et page d'aide
├── assets/                  polices (licence OFL) et icônes générées
├── store/                   fiche App Store et captures d'écran 1290 × 2796
└── tools/                   générateurs d'icônes et de captures
```

## Ce qui est prêt

- L'app fonctionne **hors ligne**, sans aucune requête réseau (polices incluses).
- Les données sont doublées dans les Préférences natives d'iOS (plugin `@capacitor/preferences`), pour ne rien perdre si iOS vide le stockage web.
- Projet Xcode réglé : iPhone seulement, portrait, mode sombre, nom « Ma Session », version 1.0.0, pas de question sur le chiffrement.
- Icône 1024 × 1024 sans transparence, écran de lancement, 6 captures App Store.
- Politique de confidentialité et page d'aide, publiées avec la version web.
- Fiche App Store complète : [`store/fiche-app-store.md`](store/fiche-app-store.md).

## Ce qu'il vous reste à faire

Ces étapes demandent votre identité, votre argent ou un Mac : personne ne peut les faire à votre place.

### 1. Le compte développeur Apple

- Inscrivez-vous sur [developer.apple.com/programs](https://developer.apple.com/programs/) : **99 $ US par année**.
- Il faut avoir l'âge de la majorité (18 ans au Québec). Sinon, un parent peut ouvrir le compte à son nom.
- Comptez de quelques heures à deux jours pour l'approbation.

### 2. Mettre la version web en ligne (pour les liens de confidentialité et d'aide)

Apple exige une URL de politique de confidentialité et une URL d'assistance.

1. Sur GitHub : **Settings → Pages → Source : GitHub Actions**.
2. **Settings → Secrets and variables → Actions → Variables** : créez `MS_CONTACT` avec le courriel à afficher aux utilisateurs.
3. Relancez le flux « Build & deploy ». Les pages seront à :
   - https://sped081.github.io/vita/ma-session/ (l'app web, installable : Safari → Partager → « Sur l'écran d'accueil »)
   - https://sped081.github.io/vita/ma-session/confidentialite.html
   - https://sped081.github.io/vita/ma-session/aide.html

### 3. Construire l'app sur un Mac

Il faut un Mac avec la dernière version de **Xcode** (gratuite sur le Mac App Store) et [Node.js](https://nodejs.org) 20 ou plus. Pas de Mac ? Le cégep en a souvent en laboratoire.

```bash
git clone https://github.com/sped081/vita.git
cd vita/app
npm install
MS_CONTACT="votre@courriel.com" npm run ios   # construit www/ et le copie dans le projet Xcode
npm run open                                  # ouvre Xcode
```

Dans Xcode :

1. Cliquez sur **App** (à gauche) → onglet **Signing & Capabilities** → **Team** : choisissez votre compte développeur.
2. Si Xcode dit que l'identifiant `com.sped081.masession` est pris, remplacez-le (par exemple `com.votrenom.masession`) ici **et** dans `capacitor.config.json`.
3. Testez : choisissez un simulateur iPhone (ou votre iPhone branché) en haut, puis ▶.
4. Publiez : **Product → Archive**, puis **Distribute App → App Store Connect → Upload**.

### 4. Créer la fiche sur App Store Connect

1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **Apps → + → Nouvelle app** (plateforme iOS, français (Canada), votre Bundle ID).
2. Copiez les textes de [`store/fiche-app-store.md`](store/fiche-app-store.md).
3. Glissez les 6 images de `store/screenshots/`.
4. **Confidentialité de l'app** : « Données non collectées ».
5. Choisissez la version envoyée depuis Xcode (elle apparaît après 10 à 30 minutes), puis **Soumettre pour examen**.

L'examen d'Apple prend en général de 1 à 3 jours.

## Mettre l'app à jour

1. Modifiez `etudes/ma-session.html` (la même page sert partout).
2. Augmentez la version dans `package.json` et, dans Xcode, **Version** et **Build** (onglet General).
3. `npm run ios`, puis **Product → Archive** comme la première fois.

## Régénérer les images

Ces outils demandent `playwright-core` et un Chromium (installés à la racine du dépôt avec `npm install`).

```bash
npm run assets        # icônes et écran de lancement depuis tools/icon.svg
npm run build && npm run screenshots   # captures App Store depuis www/
```

Après `npm run assets`, recopiez `assets/icons/icon-1024.png` vers `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` et `assets/icons/splash-2732.png` vers les trois images de `ios/App/App/Assets.xcassets/Splash.imageset/`.
