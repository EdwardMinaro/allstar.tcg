# Playlist Halloween

Source fournie par l'utilisateur : `settings (1).mp3`, durée 7184,788 s. Seuls les dix premiers titres sont retenus, suivant sa correction. Les horaires ci-dessous sont ceux fournis à l’origine ; les séparations effectives ont été ajustées sur le signal du fichier source après le retour utilisateur sur les fins audibles au début des pistes.

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

`tools/split_halloween_audio.js` décode avant découpe et réencode en MP3 192 kbit/s pour respecter les séparations corrigées. Il vérifie chaque durée. Les bornes contiguës sont partagées : aucune seconde supprimée entre deux pistes, aucun fondu ajouté. Bornes effectives en secondes : 0, 222.445, 509.045, 741.98, 1051.995, 1330.105, 1562.375, 1852.46, 2086.72, 2347.005, 2579.44. Le dixième conserve ainsi aussi sa fin. Ajustements fondés sur les transitions de forme d’onde ; écoute utilisateur finale à confirmer. Les fichiers sont dans `assets/audio/music/halloween/`, numérotés de 01 à 10. Le mix long du jeu est remplacé par ces titres ; le fichier original fourni dans Téléchargements reste intact.

Dans les options d'accueil et en partie, Catcheurs/Halloween peuvent être cochés séparément ou ensemble. Au moins une playlist reste cochée. La liste des titres est regroupée par playlist ; Halloween conserve l'ordre de la tracklist dans le menu. La radio aléatoire, le passage automatique au morceau suivant, Suivante et Précédente respectent les playlists actives. Les préférences sont locales, comme le volume audio. Un changement ne relance pas une musique mise en pause ou arrêtée.

Sans préférence sauvegardée, les deux playlists sont actives pendant l'événement et la piste 01 commence à l'ouverture. Hors événement, les nouveaux profils audio démarrent avec Catcheurs seuls. Un choix déjà sauvegardé est toujours respecté ; Halloween reste sélectionnable après l'événement. Le choix audio ne change ni les dates du paquet, ni les règles du cadeau cosmétique.
