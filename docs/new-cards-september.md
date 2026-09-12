# Cartes de septembre — intégration locale

Huit catcheurs ajoutés : Yacine Osmani rare/légendaire, Maxxy rare, The Iconic Charlie rare, Agathe Aries standard/légendaire, G KING standard/légendaire. Les standards n'ont aucun effet. Statistiques légendaires imprimées : Yacine 8/6/8/6, Agathe 5/7/7/9, G KING 9/7/4/8 (Force, Technique, Vitesse, Charisme). PNG détourés sans marge blanche extérieure.

Thèmes fournis : Agathe Aries et G KING, liés aux deux raretés et affichés sous le nom du catcheur dans le lecteur. Aucun thème inventé pour les autres nouveaux catcheurs.

## Effets

- Yacine : bonus du round 1 du match ; à chaque round suivant son entrée, transfert aléatoire de 1 point entre deux statistiques distinctes, sans gain dans une statistique déjà à 10 ni perte dans une statistique à 0. Un seul transfert par round, conservé dans l'état réseau.
- Charlie : effet existant de +2 Technique et Charisme au round 1.
- Agathe : copie à son entrée l'effet effectif de l'adversaire présent, sans changer les données de sa carte. Déclenche l'apparition copiée et conserve le passif copié. Pas de copie récursive si aucune capacité n'est déjà copiée ; sans adversaire ou face à un standard, aucun effet à copier.
- Maxxy : le catcheur effectivement envoyé au vestiaire après sa défaite passe dans celui de Maxxy, sans duplication. Un sauvetage, un retour au deck ou un second souffle qui empêche cette destination reste prioritaire. Le boss du mode Défi reste soumis à sa mécanique de PV ; une victoire de round qui lui retire des PV ne le transforme pas en carte récupérable.

## G KING : interprétations appliquées

L'inversion concerne les bonus/objets déjà équipés à son apparition. Les actions instantanées achevées ne sont pas rejouées ou annulées rétroactivement. L'inversion est conservée avec l'état du match, cesse pour la carte lorsqu'elle est rejouée après avoir quitté le terrain et une seconde inversion rétablit le sens d'origine.

| Famille | Inversion |
| --- | --- |
| Modificateurs actifs de statistiques et tombé | Changement de signe de la contribution suivie, sans recalcul aléatoire des anciennes valeurs |
| Pioche différée ou récurrente | Défausse du même nombre, même échéance/probabilité |
| Défausse adverse récurrente | Pioche pour le propriétaire de l'équipement |
| Récupération répétée d'Extincteur | Envoi d'une carte de la main au vestiaire, au choix du joueur |
| Annulation | Libération de l'annulation, sans ressortir du vestiaire les équipements déjà détruits |
| Gain permanent aléatoire | Perte permanente aléatoire avec la même probabilité |
| Durée supplémentaire des objets | Réduction de durée, avec minimum d'un round pour un objet posé |
| MR Ringsider | Défausser une carte pour gagner un TAG, dans la limite habituelle de deux TAG ; facultatif, une fois par round |
| Caméra | Relance en cas de victoire au lieu de défaite, une fois par round |
| Autorisation de relancer la roulette | Autorisation neutralisée pendant l'inversion |
| Bonus conditionnel R-MAN | Malus de même amplitude sous la même condition |

G KING peut lever l'annulation de son effet d'apparition par le bonus adverse : cette exception est nécessaire pour inverser ce type d'équipement. L'immunité aux autres cartes du catcheur adverse reste respectée.

## Vérification

`tools/new_cards_test.js` compare les deux bases de données, les valeurs légendaires, l'absence d'effets standards et teste transfert, copie sans récursion, copie d'un effet récurrent, capture via la victoire réelle, sauvetage prioritaire, inversion de statistiques/protection/pioche/récupération/annulation/durée/Caméra et remise à zéro lors d'une nouvelle pose. Il simule aussi le changement de point de vue entre les deux joueurs afin de vérifier que les contributions suivies restent attachées au bon catcheur après synchronisation. Une partie réelle avec deux comptes reste le seul contrôle complet de l'interface réseau et du service distant.

Contrôle final du 12 septembre : huit PNG chargés et examinés après correction du double bonus légendaire du studio ; métadonnées audio lisibles (Agathe 88,05 s ; G KING 165,89 s) ; terrain et piles sans coupure en 1920×1080, 1360×768 et 1280×720 ; écran carrière visible et entièrement contenu dans ces trois résolutions ; sélection de l'adversaire, verrouillage, repli des saisons, choix du deck et lancement du combat vérifiés. La suite complète compte 70 contrôles réussis et aucune erreur bloquante. L'application Windows 0.2.24 et son installateur NSIS ont été générés localement avec succès. Aucun push ni aucune publication n'a été effectué.
