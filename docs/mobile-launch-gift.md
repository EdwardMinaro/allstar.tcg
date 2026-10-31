# Cadeau de lancement téléphone — novembre 2026

Version 0.2.39. Campagne `mobile_launch_2026_11`, du 1er novembre 2026 à 00 h au 1er décembre à 00 h exclu, heure de Paris (donc 1er–30 novembre inclus).

Chaque compte connecté reçoit une seule fois 5 000 crédits et une Ultime aléatoire. Les six Ultimes du catalogue participent, dont Marc Sebire et Ultima Sombra Halloween. Tirage uniforme parmi les Ultimes non possédées ; si toutes sont déjà possédées, tirage uniforme parmi les six. Le cadeau est commun aux versions PC et téléphone, nouveaux et anciens comptes. Pas d'attribution en invité.

## Première entrée

1. Le guide de récupération/confirmation de sauvegarde existant conserve la priorité. Une session bloquée ne peut pas entrer dans le jeu ni demander le cadeau. Une copie PC préparée mais non récupérée suspend également l'attribution.
2. Après sauvegarde et vérification du compte : communiqué officiel du cadeau, puis ouverture d'un paquet d'une seule carte, l'Ultime attribuée. Les crédits sont déjà enregistrés, sans fausse carte de crédits dans le paquet.
3. Communiqué Halloween si la période est active et que l'annonce n'a pas déjà été vue sur cet appareil.
4. Le paquet Champion habituel d'un nouveau compte est conservé et présenté ensuite. L'ancienne campagne Marc Sebire reste expirée, sans être réactivée.

La navigation du menu attend la vérification initiale et les ouvertures de démarrage ne proposent pas de raccourci Collection qui détournerait la séquence.

## Attribution et sauvegarde

`AllstarSaveService.claimMobileLaunchGift` écrit dans une transaction le solde, la collection, le miroir de collection, la révision, les copies de secours et le reçu `users/UID.campaignRewards.mobile_launch_2026_11`. Une demande ultérieure retrouve le même reçu sans ajouter de récompense. Les écritures normales préservent ce champ ; les restaurations contrôlées détectent ses changements via `migrationProfileToken`. Il n'est pas recopié dans `profileProgress`.

La présentation intervient après rechargement du compte via le chemin de cache protégé. `presentedAt` est enregistré après fermeture du paquet. En cas d'interruption, la présentation peut reprendre avec la même carte, sans nouvelle attribution. Un reçu déjà attribué peut être présenté après la fin de l'événement. Les erreurs de sauvegarde restent visibles ; pas de communiqué de réussite anticipé ni de récompense locale à envoyer plus tard.

Ces protections couvrent les chemins des versions actuelles et la concurrence normale entre appareils. Elles ne remplacent pas des règles serveur anti-triche ; les tests ne modifient aucun compte réel.

## Vérification

- `npm run test:accounts` inclut `mobile_launch_gift_test.cjs` : limites horaires, six cartes, priorité non possédées, doublon si collection complète, huit demandes concurrentes, reprise du reçu, acquittement, copie PC prioritaire, panne réseau, conflit, historique et limite de taille.
- `npm run test:launch-gift-browser` : Chromium PC et téléphone paysage, première connexion bloquée puis confirmation, communiqué, une seule carte, interruption/reconnexion, Halloween ensuite, compte PC sans double attribution, nouveau compte avec Champion conservé et invité sans cadeau. Authentification et Firestore simulés, trafic extérieur bloqué.
- Suite générale `npm run verify` : effets, audio, en ligne, règles de decks et géométrie existants.

La publication de cette version reste nécessaire avant l'annonce publique ; les tests avancent uniquement l'horloge des comptes fictifs au 1er novembre, sans rendre la campagne disponible en production le 31 octobre.
