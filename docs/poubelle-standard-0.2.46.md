# Poubelle Standard et résultat du Défi ALLSTAR

Poubelle passe en Standard dans tout le jeu. Nouveau texte : « L’adversaire choisit une carte de sa main puis la défausse. » Le joueur ciblé choisit dans sa propre main, même hors de son tour ; l’IA choisit une carte et préserve si possible son dernier catcheur. Batte de baseball reste Rare et aléatoire.

Le gabarit validé de Chaise Standard fournit le cadre, les encarts et la transparence. La photo, le nom et la citation de Poubelle sont conservés ; seul l’effet est composé avec Montserrat embarquée du studio. PNG 1102×1498 ; rafraîchissement du cache PC/mobile. Identifiant historique `rare_objets_poubelle` conservé pour collections/decks/récupérations ; futurs surplus à10crédits, anciens crédits et registre de conversion préservés.

En ligne, le protocole transactionnel de choix existant accepte une défausse : seul le joueur ciblé peut soumettre un identifiant de sa main ; seul le résolveur applique la défausse et publie le nouvel état. Publication obsolète et double validation refusées, choix doublés successifs, actions suspendues pendant le choix.

Après une victoire au Défi ALLSTAR hebdomadaire, le bouton Rejouer est masqué et désactivé. Une défaite le réactive ; la garde existante empêchant de relancer un défi terminé reste présente.

Christmas Blitz reste au stade du cadrage, sans nouveau mode implémenté. Les dernières décisions d’éligibilité sont conservées dans `outputs/allstar-noel-2026/` hors du dépôt.

Validation : test ciblé gameplay/choix/registre/conversion/résultat ; navigateur PC et téléphone avec toucher réel, deux RoomService simulés et résolveur dans chacun des deux emplacements ; verify et tests des sauvegardes. Ces essais n’utilisent aucun compte réel et ne constituent pas un essai humain sur Firebase en production. Aucun déploiement, push ou règle Firebase modifié.
