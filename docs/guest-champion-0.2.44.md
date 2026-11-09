# Pack Champion invité — 0.2.44

Le retrait des cadeaux invités en 0.2.43 avait également retiré le pack Champion de départ. Les nouvelles parties invitées restaient à 15 cartes et ne pouvaient pas lancer un match exigeant un deck de 20. Anthony demande explicitement le rétablissement du pack au premier démarrage invité sur un appareil.

## Comportement

- Le pack Champion de cinq cartes est à nouveau offert à l'invité. Aucun crédit initial, cadeau de campagne ou protège-carte de connexion n'est ajouté.
- Un reçu local indépendant de la progression (`allstarsGuestWelcomeV1`) conserve les cinq identifiants tirés et l'identifiant de source. Reconnexion : aucun nouvel ajout. Suppression puis recréation d'une partie invitée : même tirage restauré et même source, donc pas de renouvellement de tirage ni de nouvelle source transférable. Ce reçu est propre au stockage de l'installation/navigateur ; il ne permet pas d'identifier physiquement un appareil après effacement complet des données.
- Le tirage de départ respecte le plafond de deux exemplaires et les limites du deck (trois Légendes/Ultimes partagées, une Ultime maximum). Les cartes qui ne rentreraient pas sont remplacées par des Rares admissibles avant présentation. Les quinze Standards et les cinq cartes obtenues composent ainsi un deck légal de vingt cartes, sans convertir le départ en crédits au détriment du nombre de cartes jouables.
- Les parties invitées 0.2.43 déjà à quinze cartes récupèrent également ce pack. Un deck portant l'identifiant de départ `starter` est complété à vingt cartes à partir de la collection, en conservant ses premières cartes ; les decks personnels ne sont pas reconstruits.
- Création d'un compte depuis cet invité : pack conservé, `welcomeClaimed` conservé, aucun second Champion. Rattachement à un compte existant : les exemplaires offerts du pack sont exclus des ajouts, conformément à l'avertissement sur les cadeaux ; une copie supplémentaire acquise en jouant reste éligible. Le reçu global de source unique reste inchangé.

## Validation

- `test:guest-welcome` : nouveau départ, vingt cartes possédées et deck lançable, tirages répétés extrêmes (doublons/Ultimes), zéro bonus monétaire/campagne, rechargement sans ajout, restauration du même tirage/source après reset, réparation du deck quinze cartes 0.2.43, règles de transfert vers nouveau compte et compte existant.
- `test:accounts` et `verify` : réussis ; audit 236 cartes sans erreur, treize avertissements historiques.
- Test navigateur invité PC/téléphone : ouverture réelle des cinq cartes, validation du deck, création/transfert et message de cadeau personnel sur données fictives. Régression navigateur du cadeau de lancement : pack invité présent mais aucun cadeau de compte acquis en invité.
- Construction mobile préparée. Aucun compte réel ni règle Firebase modifié, aucun push ni publication effectué.

Ce document remplace uniquement le retrait du Champion invité décrit dans `duplicates-guest-0.2.43.md` ; les autres protections restent applicables.
