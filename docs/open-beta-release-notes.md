# ALLSTAR entre en bêta ouverte

Cette version permet de tester publiquement le jeu complet : carrière, duel contre l'IA, Défi ALLSTAR, collection, construction de decks et multijoueur.

## Protection des sauvegardes — version 0.2.35

- En jeu normal, un enregistrement qui ferait disparaître des cartes ou régresser la carrière est refusé. Les dépenses de crédits et de tickets restent possibles.
- Avant un enregistrement, une copie de secours du compte est conservée dans la même transaction : première copie de référence et jusqu'à cinq copies récentes. Les copies locales sont également conservées.
- Une ancienne sauvegarde PC identifiée comme appartenant au même compte et plus complète, ou un profil connu sans sauvegarde cohérente, déclenche une vérification avant de continuer. Aucun nouveau départ n'est créé automatiquement dans ce cas. Les fichiers de récupération vérifiés restent utilisables.
- Le chargement vérifie l'écriture locale et l'identité de la session ; une réponse tardive d'un autre compte ne peut pas remplacer le chargement courant.
- L'outillage de récupération d'archives locales et des historiques de secours est désormais conservé et testé dans le projet. Les imports ordinaires restent suspendus.

## Récupérations contrôlées précédentes — version 0.2.34

- Les imports ordinaires restent suspendus. Seuls les fichiers de récupération examinés par l'équipe peuvent être proposés puis confirmés sur le compte correspondant. Leur contenu est vérifié à la sélection et à la confirmation ; un même fichier ne peut pas être réappliqué après une récupération réussie.
- La première copie de secours du compte est conservée lors de ces récupérations. Les protections de copie locale de la version 0.2.33 restent actives.

## Correctif de protection précédent — version 0.2.33

- Le transfert par import de fichier est temporairement suspendu après des signalements de pertes de progression. Conservez vos fichiers exportés ; cette mise à jour ne restaure pas automatiquement les données manquantes.
- Avant de charger la progression du compte, le jeu conserve une copie locale brute de la sauvegarde de ce compte déjà présente sur l'appareil, y compris lorsqu'elle n'avait aucune modification en attente. Si cette copie ne peut pas être conservée et vérifiée, le remplacement local est interrompu.

## Nouveautés précédentes — version 0.2.32

- Lorsque le lien est reconnu comme ouvert dans Instagram, l'accueil et le bouton « Installer » expliquent comment l'ouvrir dans un navigateur externe, avec copie du lien et consignes Android/iPhone. L'aide générique mentionne aussi Instagram si son navigateur n'est pas reconnu.

## Nouveautés précédentes — version 0.2.31

- À l'ouverture du lien mobile, un écran aux couleurs du jeu propose « Jouer » et « Installer ». L'installation est proposée directement lorsque le navigateur le permet ; sinon un guide Android/iPhone et un bouton de copie du lien accompagnent le joueur. Cet écran est ignoré depuis l'application déjà installée.

## Nouveautés précédentes — version 0.2.30

- Sur mobile, la musique et les sons se suspendent lorsque le jeu passe en arrière-plan. La musique reprend à la même position au retour, sauf si le joueur l'avait mise en pause ou arrêtée.

## Nouveautés précédentes — version 0.2.29

- Le profil présente les protège-cartes non possédés en grisé avec un badge. Leur mode d'obtention s'affiche au survol, au clavier ou au toucher, centré sous les choix. Le texte d'explication permanent est retiré.

## Nouveautés précédentes — version 0.2.28

- Sur mobile, le bouton « Verrouiller en paysage » est retiré des options ; l'application conserve son ouverture en paysage et l'import de sauvegarde PC.
- Sur l'application Windows, les options proposent « Exporter la sauvegarde ». Ce bouton enregistre un fichier JSON à l'emplacement de votre choix, compatible avec l'import mobile du même compte ALLSTAR.

## Nouveautés précédentes — version 0.2.27

- ALLSTAR est désormais accessible sur téléphone en paysage : [ouvrir ALLSTAR Mobile](https://allstar-mobile-65102.web.app/). L'ajout à l'écran d'accueil permet de le lancer depuis son icône.
- Les comptes partagent leur collection, leurs decks, leurs crédits et leur progression entre PC et téléphone. Les sauvegardes du compte sont lues sur le serveur, avec protection contre l'écrasement par un appareil resté sur une ancienne progression. Le mode invité reste local.
- Commandes tactiles : aperçu et bouton Jouer sur les cartes, balayage pour changer de musique et double toucher pour mettre en pause ou reprendre.
- Sur mobile, les boutons des menus et les cartes de sa propre main sont agrandis en conservant l'assemblage du plateau.
- Le salon de jeu en ligne adopte une nouvelle présentation commune au PC et au mobile.
- La navigation musicale est corrigée : démarrage Halloween aléatoire, historique précédent/suivant cohérent et pause conservée.
- Les prochaines publications Windows et mobile utilisent le même lancement GitHub ; l'application mobile se met à jour à sa réouverture sans réinstallation.

## Événement Halloween — depuis la version 0.2.26

- L'événement Halloween est disponible du 29 octobre au 19 novembre inclus : ambiance noire et orange, musique d'accueil spéciale et pack Halloween à 666 crédits.
- Le lecteur propose deux playlists à cocher, Catcheurs et Halloween, séparément ou ensemble. Les 10 morceaux Halloween sont sélectionnables individuellement ; les préférences sont conservées au redémarrage.
- Cinq cartes exclusives rejoignent temporairement le jeu : Ben Damage, Melusine, Black Sam, Hades et Ultima Sombra.
- Un protège-carte Halloween à citrouille est offert à la première connexion entre le 29 octobre et le 19 novembre 2026 inclus. Une fois reçu, cet objet cosmétique reste dans votre inventaire et peut être équipé dans le profil, même après l'événement.
- L'éditeur de decks peut maintenant filtrer les cartes par famille d'effet.
- Les cartes Ultimes occupent désormais une place Légendaire dans la limite du deck, avec une seule Ultime maximum.
- Les commandes musicales restent utilisables pendant le tour adverse.

## Installation

1. Téléchargez `ALLSTAR-Setup-...exe` dans les fichiers de cette release.
2. Lancez l'installateur et choisissez le dossier d'installation.
3. Au premier lancement, créez votre compte ALLSTAR ou connectez-vous.

Les versions suivantes seront recherchées et installées automatiquement avant l'ouverture du jeu.

## Retours de bêta

Le bouton **Tickets** du menu permet de signaler directement :

- un bug ;
- un effet de carte incorrect ;
- un problème d'ergonomie ;
- une suggestion.

Précisez le mode de jeu, les cartes concernées et les actions effectuées. Le jeu joint automatiquement votre version au ticket.

## À savoir

- Une connexion Internet est nécessaire pour le compte, les sauvegardes synchronisées, le classement et le multijoueur.
- Windows peut afficher un avertissement SmartScreen car l'application n'est pas encore signée numériquement.
- Cette version reste une bêta : des équilibrages, corrections de cartes et ajustements d'interface continueront d'arriver.
