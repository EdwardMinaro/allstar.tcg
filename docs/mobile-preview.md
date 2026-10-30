# Première version mobile — 29 octobre 2026

## Publication et mises à jour

À ce stade, les publications sont **séparées** : `.github/workflows/publish-release.yml` construit et publie seulement Windows ; le site mobile privé est préparé depuis les mêmes fichiers du jeu puis publié avec Sites. Aucun déploiement mobile automatique n'est branché sur le workflow Windows. Les sauvegardes/comptes Firebase partagés ne synchronisent pas le code des applications.

Sur le site, les fichiers du jeu changent à la prochaine ouverture/actualisation ; le service worker ne met en cache que les images. Une page de partie déjà chargée ne reçoit pas un remplacement de code à chaud. Windows garde son mécanisme de mise à jour Electron. Une publication coordonnée d'une même version sur les deux supports reste à organiser pour une diffusion publique ; ce document ne prétend pas qu'elle est déjà automatisée.

Écran Jouer en ligne : présentation commune dans `css/online-lobby.css` (choix de modes explicités, titre, bloc de recherche et minuterie, activité du salon repliable), IDs et commandes existants conservés, pas de changement du matchmaking. Préparé pour le PC dans la source, visible sur le site de test après publication, application Windows installée inchangée tant qu'une nouvelle release n'est pas distribuée.

Régression audio réelle : `npm run test:mobile-audio` utilise les mêmes variables de runtime que `test:mobile`, lit les MP3 de la copie web et injecte des touches/balayages Chromium réels. Vérifie dix titres uniques, passage après Graveyard, aller-retour historique et double toucher pause/reprise. Complète les tests simulés de `audio_exclusivity_test.js` ; aucun compte Firebase ni matchmaking réel utilisé.

## Adaptations tactiles du 30 octobre, après validation de la partie Android

Demandes utilisateur : adapter les commandes et les tailles au téléphone, sans déplacer l'assemblage validé du match. Les modifications sont limitées à l'entrée mobile (`?mobile=1`).

- Balayage gauche sur le fond : musique suivante ; droite : précédente ; double toucher : pause/reprise. Actif aussi pendant le tour adverse. Départ sur une carte, un bouton, un lien, une saisie, une case ou la main exclu : préserver les interactions normales et le défilement horizontal de la main. Un défilement vertical n'est pas une commande musicale.
- Onglets « Touches rapides » remplacés par « Gestes tactiles » dans les deux panneaux d'options, sans commandes de clavier à reconfigurer.
- Réglages de résolution et ancien plein écran PC remplacés par « Verrouiller en paysage ». Le wrapper demande le plein écran puis le verrouillage natif si disponible. En cas de refus/absence, texte explicatif et écran de rotation portrait déjà présent. Ne pas annoncer un verrouillage réussi si l'API a refusé.
- Cartes de la main du joueur à140px de haut dans le viewport virtuel : conservation de la ligne142px réservée, suppression du padding vertical excédentaire de cette seule main. Aucune modification de taille/position du ring, des deux panneaux, des piles, du journal ou des dos adverses. Main longue défilable au toucher.
- Boutons d'accueil et de connexion agrandis, mêmes rangées ; panneau du menu rapide et panneaux d'options agrandis avec commandes plus grandes et défilement si nécessaire. Hors de ces panneaux, l'assemblage du match reste la référence.

Régression `npm run test:mobile` (nécessite les variables `ALLSTAR_TEST_PUPPETEER` et `ALLSTAR_TEST_BROWSER` pointant vers le runtime navigateur disponible, éventuellement `ALLSTAR_TEST_URL` pour le serveur de la copie web). Contrôles sur de vrais événements tactiles Chromium : commandes musicales, exclusions cartes/défilement, huit cartes défilables, paysage non pris en charge, réglages PC préservés hors entrée mobile. Comparaison des rectangles du match avec `tools/fixtures/mobile-approved-v2.css` (source privée Sites23226294b523b2e2b24fe9c0c0a73e0ee616f99e) : mêmes positions/dimensions des douze éléments structurants ; seules les cartes de la main changent. Le test de pose effective avec « Jouer » après re-render a également été repassé.

Prototype navigateur uniquement, paysage sur tous les écrans. Aucun déploiement public ni changement des règles Firebase. Le serveur utilise le projet Firebase existant : se connecter avec un vrai compte lit et modifie réellement sa progression.

## Essai sur téléphone et PC

Le lien d'essai hébergé est maintenant accessible sans compte ChatGPT, à la demande d'Anthony : https://allstar-mobile-essai-anthony.anthony-meunier84000.chatgpt.site/. Chaque joueur utilise son propre compte ALLSTAR. Le manifest et les icônes permettent l'ajout à l'écran d'accueil ; l'installation réelle Android/iPhone reste à confirmer par les testeurs. Accès anonyme et absence d'erreurs d'installabilité vérifiés dans Chromium. L'activation du service worker échoue dans le navigateur de test automatisé (« Service Worker system has shutdown ») : pas de validation du cache ou du hors ligne. Conserver une connexion Internet pour le jeu et les sauvegardes.

Lancer `npm run mobile:preview` dans le dossier du jeu. Le serveur affiche son adresse Wi-Fi (port 8267). PC et téléphone doivent être sur le même réseau ; autoriser Node sur le réseau privé si Windows le demande. Aucun transfert de port sur la box n'est nécessaire.

- Téléphone : `http://ADRESSE_DU_PC:8267/mobile.html`
- PC : `http://127.0.0.1:8267/index.html`

Pour cet essai, utiliser **ce lien PC mis à jour**, pas une ancienne application Windows : les anciennes versions ne disposent pas du contrôle de concurrence et peuvent réécrire une ancienne progression.

Se connecter au même compte sur chaque support. Au retour au menu et après un match, « Progression sauvegardée ✓ » apparaît deux secondes après confirmation du serveur. Les sauvegardes ordinaires restent automatiques et discrètes ; les erreurs restent visibles. Attendre la confirmation avant de changer d'appareil. Sur le second appareil, se connecter ou utiliser « Charger la progression du compte » si un changement est détecté. Une partie en cours n'est pas transférée : compte, collection, crédits, decks et progression sont partagés. Le mode invité demeure local et n'affiche pas de confirmation de sauvegarde sur le compte.

Le bandeau d'essai mobile a été retiré. La récupération d'une ancienne sauvegarde PC reste dans Options → Affichage / session et demande toujours un fichier valide correspondant au compte, puis une confirmation explicite. La PWA préparée utilise `display: fullscreen` et `orientation: landscape`. Dans un onglet navigateur, le premier toucher tente le plein écran et le verrouillage paysage ; leur disponibilité dépend du navigateur. Le réglage paysage dans les options permet de réessayer.

## Composition et tactile

`mobile.html` contient le jeu dans une iframe de hauteur virtuelle 768 px et largeur adaptée au ratio de l'écran, au minimum 1360 px. L'ensemble est ajusté à l'écran : ring, zones, piles et journal conservent leur assemblage PC. Aucune règle de réduction mobile n'est ajoutée à la grille PC. `css/mobile.css` et `js/mobile.js` activent les adaptations tactiles seulement avec `?mobile=1`. En portrait, un écran demande de tourner le téléphone. Plein écran et verrouillage paysage sont tentés si le navigateur les propose ; la rotation manuelle reste nécessaire ailleurs.

Toucher une carte de la main ouvre un aperçu lisible, puis Jouer/Défausser confirme l'action d'origine. Les cartes posées sur le ring peuvent aussi être agrandies. Les boutons + et − de l'éditeur permettent de construire les decks sans glisser-déposer. La version est destinée à évaluer taille et ergonomie sur un vrai téléphone ; elle n'est pas encore un paquet Android/iOS.

## Sauvegardes du compte

- Lecture explicite du serveur Firestore avant l'entrée dans le jeu connecté. Pas de repli silencieux sur une vieille copie locale en cas d'échec.
- Sauvegarde distante prioritaire ; aucun mélange automatique avec une partie invitée ou un autre compte. Les copies locales sont séparées par UID et servent de cache/récupération, pas d'autorité entre appareils.
- Les anciennes clés locales sont préservées. Si une progression PC n'avait jamais atteint Firebase, elle ne sera pas importée automatiquement : la conserver et examiner sa migration avant de l'utiliser sur téléphone.
- Écritures sérialisées et transactionnelles, avec comparaison de la progression lue (également sensible aux écritures d'un ancien client). Les champs du profil hors progression sont préservés ; les maps d'inventaire/decks sont remplacées, pas fusionnées carte par carte.
- Si un autre appareil écrit, l'envoi obsolète est refusé et un écran propose de recharger le compte. Les changements en attente sont conservés dans `allstarsPending:UID:date` avant rechargement pour récupération.
- Erreurs et échecs d'envoi visibles jusqu'à résolution. Tentative d'envoi lors du passage en arrière-plan, mais aucune garantie de terminer un envoi si le système tue le navigateur : attendre la confirmation avant de changer d'appareil.

## Vérifications

`npm run test:accounts` : autorité serveur face à un invité plus récent, isolation des comptes, aller-retour PC/téléphone, tickets consommés, conflits entre clients nouveaux/anciens, erreur réseau puis nouvel essai. Firebase est simulé ; aucune écriture sur un compte réel par ces tests.

Contrôle Chromium avec viewport mobile 844×390 : connexion et plateau rendus, vrais événements tactiles pour ouvrir/fermer un aperçu, blocage portrait, présentation PC sans mode tactile. L'utilisateur a confirmé sa sauvegarde complète sur le téléphone et une partie Android réussie. Un essai iPhone et une partie réseau croisée PC/téléphone ne sont pas encore confirmés.
