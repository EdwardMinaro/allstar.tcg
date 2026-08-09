# Tickets par e-mail

Le jeu ecrit les tickets dans la collection Firestore `tickets`. Pour recevoir
automatiquement les e-mails, installe l'extension Firebase officielle **Trigger
Email from Firestore** (`firebase/firestore-send-email`) et configure-la ainsi :

1. Dans Firebase Console, ouvre **Extensions** puis installe *Trigger Email from Firestore*.
2. Choisis `tickets` comme collection surveillee.
3. Configure un compte SMTP qui envoie les messages. Une boite Gmail peut etre utilisee
   avec un mot de passe d'application, jamais avec le mot de passe Gmail principal.
4. Renseigne `allstar.tradingcardgame@gmail.com` comme adresse expediteur et/ou de reponse
   par defaut selon le fournisseur SMTP choisi.
5. Publie les regles de `docs/firestore.rules` dans Firestore Rules.

Les joueurs ecrivent uniquement dans la collection `tickets`. Ils ne peuvent lire que
leurs propres tickets ni modifier ou supprimer un ticket deja envoye.
