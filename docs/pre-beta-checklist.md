# ALLSTAR - checklist pre-beta

Lancer d'abord la verification locale :

```powershell
npm.cmd run verify
```

## Firebase (une fois par projet)

Les fichiers de regles sont des sources de reference : leur presence dans Git ne les applique pas a Firebase.

1. Dans Firebase Console, ouvrir Realtime Database > Rules et publier le contenu de `docs/firebase-realtime-database-rules.json`.
2. Dans Firebase Console, ouvrir Firestore Database > Rules et publier le contenu de `docs/firestore.rules`.
3. Tester avec deux comptes distincts : partie rapide, classee et personnalisee.

## Parcours a deux comptes

1. Lancer une partie rapide puis une partie classee avec les deux comptes.
2. Verifier que les deux profils recoivent XP, victoires/defaites et statistiques appropriees.
3. Fermer et rouvrir les deux jeux : deck, collection, carriere et profil doivent etre identiques.
4. Verifier qu'un meme match ne compte qu'une fois apres un redemarrage.
5. Verifier le classement, le profil public et la recherche de partie en arriere-plan.

## Interface et jeu

1. Tester le tutoriel du debut a la fin et le message de defausse.
2. Tester au moins une carte recente par type et consulter le journal pour chaque effet.
3. Tester en 1280x720, 1600x900 et 1920x1080, fenetre maximisee et plein ecran.
4. Verifier que les cartes, le ring, les boutons et les panneaux restent lisibles sans debordement.

## Distribution Windows

1. Le build GitHub Actions est la verification de reference : il doit etre vert avant publication.
2. Installer la release sur un PC sans environnement de developpement puis tester une mise a jour.
3. Les alertes SmartScreen resteront possibles tant que le programme n'est pas signe avec un certificat de signature de code Windows.
