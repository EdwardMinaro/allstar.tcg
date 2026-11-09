# Collections et progression invitée — 0.2.43

Suite 0.2.44 : le pack Champion invité est rétabli afin de démarrer avec un deck jouable de vingt cartes. Voir `guest-champion-0.2.44.md` ; le retrait décrit ci-dessous est l'état historique de la 0.2.43.

## Deux exemplaires par carte

Les surplus actuels et futurs sont convertis en crédits : Standard 10, Rare 50, Légende 100, Ultime 500. Il s'agit du même identifiant de carte ; les variantes de rareté ou d'événement restent distinctes. L'ouverture de paquet signale les cartes converties. Un message récapitule la conversion de la collection existante au chargement.

`playerState.cardConversions` garde le nombre cumulé de copies converties par carte. La protection compare les cartes conservées ET ce relevé, exige toujours la conservation des deux premières copies, refuse la disparition du relevé et continue de refuser une régression de carrière. La migration est enregistrée avec la copie distante avant/après ; recharger ne recrédite pas les mêmes surplus. Un ancien client qui ne conserve pas le relevé est refusé plutôt que de ressusciter les cartes converties. Les gains directs, récompenses de niveau, paquets et cadeau de lancement passent par la conversion, y compris le tirage Ultime de secours quand toutes les Ultimes sont possédées.

## Invité et compte

- Les nouvelles parties invitées ont un espace local explicite `:guest`, le deck standard nécessaire pour jouer, aucun crédit de départ, pack Champion gratuit, cadeau de campagne ou protège-carte de connexion. Les récompenses gagnées en jouant restent acquises.
- Les anciennes sauvegardes sans identité de compte sont copiées dans cet espace avec copie brute originale. Une ancienne sauvegarde portant un UID n'est jamais requalifiée automatiquement en invité.
- Options → Sauvegarde → **Enregistrer ma progression invitée sur un compte** ouvre la création ou la connexion, puis une comparaison en lecture seule et une confirmation. Le bouton existe dans les options du menu et en partie ; le rattachement attend la fin du match.
- **Nouveau compte** : progression et cadeaux invités conservés, XP/niveau/carrière et decks repris, aucun classement invité injecté. Une nouvelle partie invitée reçoit les 1 000 crédits normaux de création une seule fois pendant le transfert ; ses cartes de départ ne sont pas redonnées. Le pack Champion et les cadeaux de compte applicables suivent normalement, avec leurs reçus habituels. Une ancienne partie garde ses crédits et paquets, sans nouveau cadeau de départ déjà reçu.
- **Compte existant** : avertissement explicite « Attention : les cadeaux uniques ne seront pas transférés. » Collection fusionnée au maximum par carte, jamais additionnée ; aucun crédit artificiel pour les cartes communes aux deux sources. Une copie du Marc Sebire offert par l'ancienne campagne est exclue ; une éventuelle seconde copie acquise reste éligible. Cadeaux, cosmétiques et classement du compte conservés. XP/carrière ne diminuent pas, les récompenses de niveau déjà reçues sont conservées dans le relevé. Les gains de crédits et paquets d'une nouvelle partie invitée peuvent être repris. Pour une ancienne partie sans traçabilité, crédits et paquets restent transférables seulement lors d'une création de compte ; cet écart est annoncé avant confirmation.
- Un seul rattachement par compte et un seul compte par source invitée. Copie brute locale et copie distante intégrale, comparaison du compte et des deux sources locales, contrôle des modifications concurrentes, puis reçu et source consommée dans la même transaction. La copie locale reste disponible comme secours après consommation ; il faut ensuite jouer sur le compte.
- L'export PC ordinaire depuis le mode invité oriente vers ce parcours au lieu de fabriquer un fichier attribué à un autre compte.

Ces protections empêchent le cumul par le parcours normal. Le système existant autorise chaque propriétaire à écrire son document Firebase ; une résistance à un client volontairement modifié exigerait une autorité serveur pour tous les gains et cadeaux, hors de cette modification.

## Cadeau personnel

Un cadeau administratif en attente est accordé atomiquement après chargement de la bonne source, avec relevé, copie de secours et présentation rejouable sans réattribution. Le communiqué officiel affiche le message personnel, les 25 000 crédits et Marc Sebire. Si le joueur en possède déjà deux, la copie supplémentaire vaut 500 crédits. Le reçu présenté est acquitté après fermeture du paquet d'une carte. Les informations réelles du destinataire et les copies avant/après sont conservées hors dépôt, dans `outputs/christophe-compensation/` à la racine `al`.

## Validation du 9 novembre 2026

- `npm run verify` : réussi, 236 cartes, zéro erreur d'audit, treize avertissements historiques.
- `npm run test:accounts` : réussi, avec les nouveaux tests de conversion, reçus invités, comparaison, préservation du classement/cadeaux, cadeaux personnels et reprise.
- Tests Chromium dédiés PC et téléphone : démarrage invité sans bonus, conversion réelle, création/confirmation du compte depuis l'invité, source consommée, avertissement du compte existant, exclusion du cadeau et communiqué personnel. Comptes entièrement fictifs, trafic externe bloqué.
- Régressions navigateur du cadeau de lancement et de la liaison PC/téléphone réussies ; la liaison convertit maintenant les surplus après récupération.
- Construction mobile réussie. Captures dans `outputs/duplicates-guest-qa/` à la racine `al`.

## Règles de production activées

Le registre immuable `guestTransfers/{sourceId}` utilise la règle ajoutée dans `docs/firestore.rules`. Les règles précédentes de production ont été lues et comparées : tous les autres blocs sont identiques. La nouvelle règle a passé `projects:test`, puis la compilation Firebase au déploiement.

Un premier projet de règle permettant la lecture de tous les reçus aux utilisateurs connectés a été rejeté et remplacé : seuls les propriétaires lisent les reçus existants ; aucune liste, modification ou suppression n'est permise. La création exige le même UID et le reçu du compte dans la même transaction. Une tentative d'utiliser la source d'autrui est refusée, sans révéler ses métadonnées.

Après le refus initial du contrôle automatique, Anthony a explicitement autorisé l'activation de cette règle. Déploiement `firestore:rules` réussi le 9 novembre 2026 à 13:12 UTC. Relecture par l'API Firebase Rules : le contenu actif correspond exactement au fichier versionné (fins de ligne normalisées). Identifiant du ruleset : `38b3bdd2-1f9a-40bc-a72f-e9244b183945`.

Les copies avant/après sont conservées hors dépôt dans `outputs/christophe-compensation/rules-before-deployment.json` et `rules-after-deployment.json`. Cette étape n'a créé ni modifié aucune progression de joueur. Aucun push ni Publish Windows Release effectué ; la version 0.2.43 est maintenant prête pour ce parcours de publication habituel.
