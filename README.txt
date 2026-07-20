ALLSTARS - build joueur

Ouvrir :
- index.html dans un navigateur.

Contenu :
- index.html : interface joueur
- css/style.css : visuel et responsive
- js/game.js : logique de jeu, cartes integrees et decks
- js/audio.js : musiques, bruitages et volumes
- data/cards.json : export lisible des cartes JSON integrees
- data/card_import_report.json : rapport du dernier import cartes et garde-fous
- quarantine/cards/ : cartes refusees lors de l'import si les stats ne respectent pas les regles
- assets/cards/ : images extraites des cartes JSON
- assets/audio/ : musiques et bruitages
- Sauvegarde : pré-écran Nouvelle Partie / Charger Partie / Effacer Partie, puis auto-save localStorage
- Boutique : credits de match, boosters Classique/Premium/Champion, collection locale
- Multi experimental : js/networkAdapter.js, js/roomService.js, js/multiplayerClient.js

Le createur de cartes est volontairement absent de cette version joueur.

Backend multi :
- NetworkRoomAdapter est utilise par defaut pour le vrai multijoueur.
- Configurer window.ALLSTAR_MULTIPLAYER_CONFIG = { backendUrl: "https://..." } avant les scripts, ou allstarsMultiplayerBackendUrl dans localStorage.
- Contrat HTTP attendu : GET /rooms/:code, PUT /rooms/:code avec la room JSON en body.
- Sans backend configuré, l'écran indique "Multijoueur en ligne non configuré" au lieu de faire croire qu'un code est invalide.
- LocalRoomAdapter reste disponible uniquement pour test local avec ?multi=local ou localStorage allstarsMultiplayerMode=local.
- La room reste l'autorité logique : le client envoie une intention, le service valide, puis renvoie un état JSON.
