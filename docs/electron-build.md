# ALLSTAR Desktop

Cette couche Electron garde le jeu actuel intact : elle ouvre simplement `index.html` dans une fenetre desktop.

## Premier lancement

Depuis ce dossier :

```powershell
npm install
npm start
```

Si Electron est déjà installé localement dans le projet, `npm start` suffit. Sinon `npm install` récupérera Electron, Electron Builder et l'outil de mise à jour.

## Generer un installateur Windows

```powershell
npm run dist
```

Le resultat arrive dans `dist/`.

## Mises a jour

Le projet est préparé pour `electron-updater` avec GitHub Releases.

Avant de publier, remplace dans `package.json` :

- `TON_COMPTE_GITHUB`
- `TON_DEPOT_RELEASES`

Puis publie une nouvelle version avec :

```powershell
npm version patch
npm run publish
```

Important : l'auto-update ne s'active que dans l'application packagée. En mode `npm start`, le jeu se lance sans chercher de mise à jour.

## Icone

La fenetre utilise actuellement `assets/branding/allstars_star.png`. Pour un vrai `.exe`, ajoute plus tard une icone `.ico` et renseigne-la dans la section `build.win.icon` de `package.json`.
