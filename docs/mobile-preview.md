# Première version mobile — 29 octobre 2026

## Publication et mises à jour

Le workflow **Publish Windows Release** construit et publie Windows et le site Firebase mobile depuis le même commit. L'utilisateur a confirmé la réussite de la publication commune0.2.27. L'adresse mobile stable est https://allstar-mobile-65102.web.app/. Voir `docs/coordinated-releases.md` pour les étapes et limites de publication. Les sauvegardes du compte sont partagées, tandis que le code est distribué par ce workflow.

Sur le site, les fichiers du jeu changent à la prochaine ouverture/actualisation ; le service worker ne met en cache que les images, séparées par empreinte de construction. Une page de partie déjà chargée ne reçoit pas un remplacement de code à chaud. Windows garde son mécanisme de mise à jour Electron. L'utilisateur a confirmé l'apparition puis le retrait d'un repère temporaire sur son téléphone, après fermeture/réouverture de la même icône sans réinstallation.

Écran Jouer en ligne : présentation commune dans `css/online-lobby.css` (choix de modes explicités, titre, bloc de recherche et minuterie, activité du salon repliable), IDs et commandes existants conservés, pas de changement du matchmaking. Préparé pour le PC dans la source, visible sur le site de test après publication, application Windows installée inchangée tant qu'une nouvelle release n'est pas distribuée.

Régression audio réelle : `npm run test:mobile-audio` utilise les mêmes variables de runtime que `test:mobile`, lit les MP3 de la copie web et injecte des touches/balayages Chromium réels. Vérifie dix titres uniques, passage après Graveyard, aller-retour historique et double toucher pause/reprise. Complète les tests simulés de `audio_exclusivity_test.js` ; aucun compte Firebase ni matchmaking réel utilisé.

## Adaptations tactiles du 30 octobre, après validation de la partie Android

Demandes utilisateur : adapter les commandes et les tailles au téléphone, sans déplacer l'assemblage validé du match. Les modifications sont limitées à l'entrée mobile (`?mobile=1`).

- Balayage gauche sur le fond : musique suivante ; droite : précédente ; double toucher : pause/reprise. Actif aussi pendant le tour adverse. Départ sur une carte, un bouton, un lien, une saisie, une case ou la main exclu : préserver les interactions normales et le défilement horizontal de la main. Un défilement vertical n'est pas une commande musicale.
- Onglets « Touches rapides » remplacés par « Gestes tactiles » dans les deux panneaux d'options, sans commandes de clavier à reconfigurer.
- Réglages de résolution et ancien plein écran PC retirés des options mobiles. Le bouton « Verrouiller en paysage », utilisé au début des essais, est également retiré à la demande d'Anthony pour0.2.28. L'ouverture paysage de la PWA, la demande automatique au premier toucher et l'écran de rotation portrait restent disponibles selon le navigateur.
- Cartes de la main du joueur à140px de haut dans le viewport virtuel : conservation de la ligne142px réservée, suppression du padding vertical excédentaire de cette seule main. Aucune modification de taille/position du ring, des deux panneaux, des piles, du journal ou des dos adverses. Main longue défilable au toucher.
- Boutons d'accueil et de connexion agrandis, mêmes rangées ; panneau du menu rapide et panneaux d'options agrandis avec commandes plus grandes et défilement si nécessaire. Hors de ces panneaux, l'assemblage du match reste la référence.

Régression `npm run test:mobile` (nécessite les variables `ALLSTAR_TEST_PUPPETEER` et `ALLSTAR_TEST_BROWSER` pointant vers le runtime navigateur disponible, éventuellement `ALLSTAR_TEST_URL` pour le serveur de la copie web). Contrôles sur de vrais événements tactiles Chromium : commandes musicales, exclusions cartes/défilement, huit cartes défilables, paysage non pris en charge, réglages PC préservés hors entrée mobile. Comparaison des rectangles du match avec `tools/fixtures/mobile-approved-v2.css` (source privée Sites23226294b523b2e2b24fe9c0c0a73e0ee616f99e) : mêmes positions/dimensions des douze éléments structurants ; seules les cartes de la main changent. Le test de pose effective avec « Jouer » après re-render a également été repassé.

Application web installable en paysage. Le serveur utilise le projet Firebase existant : se connecter avec un vrai compte lit et modifie réellement sa progression.

## Essai sur téléphone et PC

Le site est accessible sans compte ChatGPT sur https://allstar-mobile-65102.web.app/. Chaque joueur utilise son propre compte ALLSTAR. Installation et mise à jour depuis l'icône confirmées par Anthony sur Android ; l'essai iPhone reste à confirmer. Accès anonyme et absence d'erreurs d'installabilité vérifiés dans Chromium. L'activation du service worker échoue dans le navigateur de test automatisé (« Service Worker system has shutdown ») : pas de validation du hors ligne. Conserver une connexion Internet pour le jeu et les sauvegardes.

Lancer `npm run mobile:preview` dans le dossier du jeu. Le serveur affiche son adresse Wi-Fi (port 8267). PC et téléphone doivent être sur le même réseau ; autoriser Node sur le réseau privé si Windows le demande. Aucun transfert de port sur la box n'est nécessaire.

- Téléphone : `http://ADRESSE_DU_PC:8267/mobile.html`
- PC : `http://127.0.0.1:8267/index.html`

Pour cet essai, utiliser **ce lien PC mis à jour**, pas une ancienne application Windows : les anciennes versions ne disposent pas du contrôle de concurrence et peuvent réécrire une ancienne progression.

Se connecter au même compte sur chaque support. Au retour au menu et après un match, « Progression sauvegardée ✓ » apparaît deux secondes après confirmation du serveur. Les sauvegardes ordinaires restent automatiques et discrètes ; les erreurs restent visibles. Attendre la confirmation avant de changer d'appareil. Sur le second appareil, se connecter ou utiliser « Charger la progression du compte » si un changement est détecté. Une partie en cours n'est pas transférée : compte, collection, crédits, decks et progression sont partagés. Le mode invité demeure local et n'affiche pas de confirmation de sauvegarde sur le compte.

Le bandeau d'essai mobile a été retiré. La récupération d'une sauvegarde PC reste dans Options → Affichage / session et demande toujours un fichier valide correspondant au compte, puis une confirmation explicite. La PWA utilise `display: fullscreen` et `orientation: landscape`. Dans un onglet navigateur, le premier toucher tente le plein écran et le verrouillage paysage ; leur disponibilité dépend du navigateur.

Dans l'application Windows0.2.28, Options → Exporter la sauvegarde ouvre le choix de fichier natif. L'export contient l'UID du compte chargé, la collection, les decks et leur sélection, les crédits, la carrière, le profil et les cosmétiques au format `allstar-account-transfer-v1` déjà accepté par l'import mobile. Un compte connecté est requis ; les invités ne sont pas associés silencieusement à un compte. L'export ne modifie pas le cloud et n'inclut pas les identifiants de connexion mémorisés. Le fichier reste soumis à la limite d'import2Mo. Les boutons d'export n'apparaissent que dans Electron et sont absents des options mobiles.

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
