# R-MAN Halloween — 0.2.42

Ajout du Bonus rare R-MAN Halloween et de son thème musical. Aucun changement aux comptes, aux protections de sauvegarde ou au parcours de synchronisation.

## Références validées

- Visuel fourni : `R-MAN_Halloween_photo_remplacee_seulement.png`. L'ancien visuel avec statistiques de catcheur est abandonné. Photo et textes internes conservés ; retrait des marges extérieures et normalisation au format commun 1102 × 1498 RGBA. Police visuellement cohérente avec les Bonus existants, sans affirmation d'identité de police à partir d'une image aplatie.
- Bonus ordinaire : +1 Force et +1 Technique. Sur un catcheur de l'événement Halloween 2026 : +1 dans les quatre statistiques **à la place**, sans cumul des deux branches.
- Tirage à 20 % par paquet, confirmé par Anthony. Conservation des six autres taux et possibilité de deux exclusives explicitement validées.
- Audio fourni : `WhatsApp Audio 2026-11-02 at 09.01.08.mp4`, piste audio AAC d'environ 3 min 30, convertie en MP3. Thème nommé R-MAN, lié aux quatre versions de R-MAN, dans la playlist normale des catcheurs. Les dix pistes de l'album Halloween restent inchangées.

## Paquet Halloween

Les sept probabilités totalisent 101 % : quatre rares à 20 %, deux légendaires à 10 % et une Ultime à 1 %. Des intervalles circulaires conservent chaque probabilité marginale ; leur ordre est mélangé par paquet pour varier la paire éventuelle. Résultat : 99 % de paquets avec une exclusive et 1 % avec deux, toujours cinq cartes au total. Prix et période inchangés. Les exclusives ne rejoignent pas les paquets ordinaires.

## Vérifications du 3 novembre 2026

- `npm run verify` : réussi, catalogue de 236 cartes, zéro erreur d'audit. Treize avertissements historiques restent présents.
- `npm run test:accounts` : réussi sur comptes fictifs, protections des cartes, synchronisation, cadeaux et achat concurrent conservés. Aucun compte réel utilisé.
- `npm run test:r-man-halloween-browser` : réussi, moteur réel `playPlayer`, deux branches de l'effet, chargement des visuels PC/téléphone, MP3 réellement décodé et lu, aucune erreur de page. Fixtures isolées et trafic externe bloqué.
- Tests dédiés : cinq catcheurs Halloween, doublement de Kev, annulation, inversion G KING et restauration, état réseau ; probabilités exactes sur sept ordres et 10 000 tirages par ordre, paquet de cinq cartes.
- Préparation mobile : réussie ; rendu WEBP 1102 × 1498, référence remplacée et piste MP3 présentes dans le résultat.
- Tag distant `v0.2.42` absent lors du contrôle préalable. Publication non effectuée par ces tests.

Captures locales : `outputs/r-man-halloween-qa/r-man-desktop.png` et `r-man-mobile.png` sous la racine de travail `al`.
