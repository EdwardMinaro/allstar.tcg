# Playlist Halloween

Source fournie par l'utilisateur : `settings (1).mp3`, durée 7184,788 s. Seuls les dix premiers titres sont retenus, suivant sa correction. Le dixième se termine à 42:55, début de la piste suivante non retenue.

| Début source | Fin source | Titre |
| --- | --- | --- |
| 00:00 | 03:42 | Graveyard Shift Warriors |
| 03:42 | 08:28 | Witchfire |
| 08:28 | 12:21 | Night Hunters |
| 12:21 | 17:30 | Forever Yours |
| 17:30 | 22:07 | Metal Eagles |
| 22:07 | 25:59 | Monster Mash: Battle Royale |
| 25:59 | 30:49 | Halloween Steel |
| 30:49 | 34:43 | Demons at the Crossroads |
| 34:43 | 39:03 | Rise of the Damned |
| 39:03 | 42:55 | Born for the Hammer |

`tools/split_halloween_audio.js` découpe les trames MP3 originales avec FFmpeg sans nouvelle compression et vérifie chaque durée. La précision des coupes suit les trames MP3 (quelques centièmes de seconde). Les fichiers sont dans `assets/audio/music/halloween/`, numérotés de 01 à 10. Le mix long du jeu est remplacé par ces titres ; le fichier original fourni dans Téléchargements reste intact.

Dans les options d'accueil et en partie, Catcheurs/Halloween peuvent être cochés séparément ou ensemble. Au moins une playlist reste cochée. La liste des titres est regroupée par playlist ; Halloween conserve l'ordre de la tracklist dans le menu. La radio aléatoire, le passage automatique au morceau suivant, Suivante et Précédente respectent les playlists actives. Les préférences sont locales, comme le volume audio. Un changement ne relance pas une musique mise en pause ou arrêtée.

Sans préférence sauvegardée, les deux playlists sont actives pendant l'événement et la piste 01 commence à l'ouverture. Hors événement, les nouveaux profils audio démarrent avec Catcheurs seuls. Un choix déjà sauvegardé est toujours respecté ; Halloween reste sélectionnable après l'événement. Le choix audio ne change ni les dates du paquet, ni les règles du cadeau cosmétique.
