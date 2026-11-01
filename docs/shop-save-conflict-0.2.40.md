# Faux conflit après achat sur téléphone — 0.2.40

Signalement du 1er novembre2026 : compte déclaré synchronisé, achat de paquet sur téléphone, message approximatif de sauvegarde modifiée puis proposition de fichier de récupération. Écran exact et présence d'un autre appareil non confirmés. Aucune donnée réelle du joueur examinée ou modifiée ; ce correctif ne constitue pas une confirmation de récupération de son achat.

## Défaut reproduit

Le contrôle de retour au premier plan compare une lecture distante à `session.token`. Pendant la lecture, le même téléphone peut finir sa propre sauvegarde d'achat et avancer son token. L'ancienne réponse est alors comparée à cette nouvelle version. Le second contrôle existant présente la même fenêtre de concurrence. Il peut donc déclarer un autre appareil alors qu'il n'y en a pas.

Reproduction déterministe avant correction : lecture serveur retardée, achat et sauvegarde, arrivée de l'ancienne réponse, autre achat pendant la seconde lecture ; `session.conflict` passe àtrue à tort. Test initial `shop_save_race_test.cjs` échouait sur `true !== false` avant correction.

## Correction

- Au retour dans le jeu, attendre les écritures déjà en vol ; ignorer ce contrôle si modifications locales en attente, hydratation, récompense ou session bloquée. Capturer token et génération avant la lecture ; n'utiliser sa réponse que si le même compte et la même version locale sont encore actifs. Une vraie écriture externe reste détectée, et chaque envoi conserve son contrôle transactionnel.
- Dans le dialogue de conflit, « Réessayer la sauvegarde » relit le compte. Seule une égalité exacte avec le dernier token accepté autorise un nouvel envoi normal ; aucune fusion forcée ni diminution de collection/carrière. Si le compte a changé ailleurs, le nouvel envoi reste refusé.
- Ne plus affirmer systématiquement qu'un autre appareil est responsable ; indiquer qu'aucun fichier n'est nécessaire pour cette vérification. L'écran de protection précise de ne pas importer de fichier sans consigne ALLSTAR.
- Empêcher de nouveaux achats et ouvertures de tickets lorsque la session est en conflit, bloquée ou en cours de vérification du cadeau.

Une personne ayant déjà rechargé puis abouti sur « Sauvegarde protégée » peut avoir des cartes locales non envoyées : la protection reste volontairement active. Son cas doit être vérifié ; ne pas lui demander d'effacer les données ou de remplacer la sauvegarde par un fichier quelconque.

## Validation

`npm run test:accounts` inclut le nouveau test : achat classique réel, lecture tardive, achat pendant la lecture avant envoi, reprise de deux paquets sans double dépense, vraie modification externe conservée, achats bloqués sans mutation locale. `npm run test:shop-save-browser` déclenche un vrai événement de visibilité et un clic sur le paquet du mode téléphone, conserve les crédits/cartes attendus, vérifie le bouton de reprise et le refus d'écraser une modification externe. Compte fictif et Firebase simulé exclusivement. Suite générale verify passée avec les 13 avertissements historiques, sans erreur.
