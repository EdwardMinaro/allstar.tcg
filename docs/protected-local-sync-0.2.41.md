# Synchroniser une copie locale conservée — 0.2.41

Après un paquet acheté sur téléphone, Anthony rapporte le message exact « La copie présente sur cet appareil contient une progression absente du compte » et confirme que l'achat ne figure pas sur PC. L'achat a donc au moins une copie locale en attente ; aucune donnée réelle n'a été examinée ni restaurée pendant le développement.

Anthony demande un bouton pour réenvoyer les nouvelles données au compte et précise que le nombre de cartes ne doit jamais baisser. La règle appliquée est plus précise : pour chaque identifiant de carte déjà présent sur le compte, la copie doit contenir au moins le même nombre d'exemplaires. Un total supérieur ne compense jamais une Ultime manquante ou un exemplaire perdu. Les crédits peuvent diminuer après un achat ; ils sont affichés avant confirmation et ne sont ni additionnés ni remplacés par un maximum.

## Parcours

Sur « Sauvegarde protégée », si une copie locale est conservée et que le compte est déjà lié :

1. « Synchroniser la copie conservée » lit et compare le compte courant, sans écriture.
2. Un récapitulatif montre cartes différentes, exemplaires, decks, crédits et carrière, avant/après.
3. « Confirmer cette progression » sauvegarde la copie locale brute puis envoie la progression vérifiée dans une transaction.
4. Le jeu recharge la sauvegarde distante confirmée et reprend l'entrée normale. Aucun fichier à importer.

La transaction refuse la disparition d'une carte ou d'une progression de carrière, les quantités/solde invalides, l'autre compte, une liaison PC encore incomplète, ou une modification du compte/profil depuis la comparaison. Le contenu local est également revérifié avant confirmation. Les protections de sauvegarde restent actives en cas de refus.

Les decks et cosmétiques acquis sont conservés, le classement reste celui du compte, et les reçus de cadeau restent inchangés. Une copie locale brute est conservée avant écriture et l'historique distant conserve les sources avant/après. Si l'affichage échoue après une transaction réussie, le message indique de rouvrir le jeu, sans recommencer l'opération. Répéter une opération ne cumule pas les crédits ou exemplaires : ce sont des valeurs absolues vérifiées.

Cette voie remplace, pour le cas courant, la proposition initiale de télécharger un diagnostic ; aucun nouveau parcours de fichier n'a été livré. Les anciens outils d'export et de récupération assistée restent disponibles.

## Tests

- `npm run test:accounts` inclut `protected_local_sync_test.cjs` : achat conservé, récapitulatif sans écriture, confirmation, moins de crédits accepté, disparition d'Ultime refusée malgré un total supérieur, copie corrompue/autre identité/refus de carrière, conflits de données et de profil, source modifiée après comparaison, conservation des decks/classement/reçus/copies, double confirmation et panne après enregistrement.
- `npm run test:protected-copy-browser` : écran en mode téléphone, clics réels, comparaison puis confirmation, paquet retrouvé sur compte fictif, copies avant/après, Ultime manquante refusée et changement concurrent refusé, aucune erreur JavaScript.
- Suite générale verify et régressions boutique/cadeau conservées.

Ces tests utilisent exclusivement de faux comptes et un Firebase simulé. Le compte du joueur signalé ne pourra être déclaré récupéré qu'après publication et confirmation humaine de sa progression.
