# ALLSTAR - lancement de la bêta ouverte

## 1. Figer la candidate

1. Arrêter les ajouts de cartes pendant la validation finale.
2. Lancer `npm.cmd run verify`.
3. Vérifier que GitHub contient bien le commit portant la version à publier.

## 2. Vérifier Firebase

À faire une seule fois, puis après toute modification des règles :

1. Publier `docs/firebase-realtime-database-rules.json` dans les règles de Realtime Database.
2. Publier `docs/firestore.rules` dans les règles de Firestore.
3. Envoyer un ticket de test et vérifier sa présence dans la collection `tickets`.

## 3. Dernier test à deux comptes

1. Jouer une partie rapide et une partie classée.
2. Vérifier XP, crédits, victoires, défaites, série, ELO et classement sur les deux comptes.
3. Modifier un deck, fermer les deux jeux, puis contrôler les données après reconnexion.
4. Lancer une recherche de match en arrière-plan et vérifier le passage automatique vers le match.

## 4. Publier

1. Pousser le commit final avec `git push`.
2. Dans GitHub, ouvrir **Actions** puis **Publish Windows Release**.
3. Cliquer sur **Run workflow** depuis la branche `main`.
4. Attendre le statut vert.
5. Ouvrir la nouvelle release et vérifier la présence de l'installateur, du `.blockmap`, de `latest.yml` et de `SHA256SUMS.txt`.

Le workflow lance les audits et construit l'installateur avant de créer le tag. Une candidate invalide ne devient donc pas une release.

## 5. Test d'installation réel

1. Installer la version sur un PC qui ne possède pas les outils de développement.
2. Créer un compte, jouer une partie et redémarrer le jeu.
3. Publier ensuite un petit correctif de test et vérifier la mise à jour automatique.

## 6. Ouvrir la bêta

Partager uniquement ce lien stable :

`https://github.com/EdwardMinaro/Allstar.tcg/releases/latest`

Il pointera automatiquement vers la version la plus récente.

## Limites connues avant signature

- SmartScreen peut prévenir que l'éditeur est inconnu.
- Les classements sont encore calculés côté client. La bêta convient aux tests publics, mais pas encore à une compétition avec enjeu ou récompense réelle.
