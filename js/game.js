const STATS=["Force","Vitesse","Technique","Charisme"];
const MAX_HAND_SIZE=7;
const TAGS_PER_MATCH=2;
let G;
let onlineApplyingRemote=false;
let onlineDirty=false;
let onlinePublishTimer=null;
let onlineLastSnapshotHash="";
let onlineLastAppliedVersion=0;
const CARD_DATA = [
  {
    "key": "legende_catcheurs_alex_ezio",
    "type": "Catcheur",
    "rarity": "Legende",
    "name": "Alex Ezio",
    "stats": {
      "Force": 7,
      "Vitesse": 5,
      "Technique": 7,
      "Charisme": 9
    },
    "effect": "Si ce catcheur est joué au Round 1, il gagne +1 en Charisme, en Technique et en Force",
    "ability": "firstRoundForceCharTech",
    "renderArt": "assets/card_renders/legende_catcheurs_alex_ezio.png",
    "musicId": "alex_ezio"
  },
  {
    "key": "legende_catcheurs_andre_levissieux",
    "type": "Catcheur",
    "rarity": "Legende",
    "name": "André Levissieux",
    "stats": {
      "Force": 7,
      "Vitesse": 4,
      "Technique": 8,
      "Charisme": 9
    },
    "effect": "S'il remporte un combat, le prochain catcheur adverse commence avec -3 Technique.",
    "ability": "winNextEnemyTechniqueMinus3",
    "renderArt": "assets/card_renders/legende_catcheurs_andre_levissieux.png",
    "musicId": "andre_levissieux"
  },
  {
    "key": "legende_catcheurs_baadshah_pehalwan_khan",
    "type": "Catcheur",
    "rarity": "Legende",
    "name": "Baadshah Pehalwan Khan",
    "stats": {
      "Force": 7,
      "Vitesse": 6,
      "Technique": 6,
      "Charisme": 9
    },
    "effect": "S'il gagne, piochez deux cartes.",
    "ability": "drawOnWin2",
    "renderArt": "assets/card_renders/legende_catcheurs_baadshah_pehalwan_khan.png",
    "musicId": "baadshah_pehalwan_khan"
  },
  {
    "key": "legende_catcheurs_big_sam",
    "type": "Catcheur",
    "rarity": "Legende",
    "name": "Big Sam",
    "stats": {
      "Force": 10,
      "Vitesse": 3,
      "Technique": 7,
      "Charisme": 8
    },
    "effect": "+20 Tombé et -10 Tombé adverse.",
    "ability": "pinDual20Shield10",
    "renderArt": "assets/card_renders/legende_catcheurs_big_sam.png",
    "musicId": "big_sam"
  },
  {
    "key": "legende_catcheurs_black_sam",
    "type": "Catcheur",
    "rarity": "Legende",
    "name": "Black Sam",
    "stats": {
      "Force": 10,
      "Vitesse": 4,
      "Technique": 6,
      "Charisme": 8
    },
    "effect": "Arrivée : prochain tombé adverse -20.",
    "ability": "pinShield20",
    "renderArt": "assets/card_renders/legende_catcheurs_black_sam.png",
    "musicId": "black_sam"
  },
  {
    "key": "legende_catcheurs_cameron_merchant",
    "type": "Catcheur",
    "rarity": "Legende",
    "name": "Cameron Merchant",
    "stats": {
      "Force": 9,
      "Vitesse": 5,
      "Technique": 9,
      "Charisme": 5
    },
    "effect": "1x/tour : -2 Force adverse.",
    "ability": "turnEnemyForceMinus2",
    "renderArt": "assets/card_renders/legende_catcheurs_cameron_merchant.png",
    "musicId": "cameron_merchant"
  },
  {
    "key": "legende_catcheurs_car_crash_gonzo",
    "type": "Catcheur",
    "rarity": "Legende",
    "name": "Car Crash Gonzo",
    "stats": {
      "Force": 5,
      "Vitesse": 8,
      "Technique": 6,
      "Charisme": 9
    },
    "effect": "Si vous jouez en premier ce tour : +2 Vitesse et +2 Technique.",
    "ability": "starterSpeedTechnique2",
    "renderArt": "assets/card_renders/legende_catcheurs_car_crash_gonzo.png",
    "musicId": "car_crash_gonzo"
  },
  {
    "key": "legende_catcheurs_drix",
    "type": "Catcheur",
    "rarity": "Legende",
    "name": "Drix",
    "stats": {
      "Force": 7,
      "Vitesse": 6,
      "Technique": 9,
      "Charisme": 6
    },
    "effect": "Round 1 : +3 Vitesse et +3 Charisme.",
    "ability": "firstRoundSpeedCharisma3",
    "renderArt": "assets/card_renders/legende_catcheurs_drix.png",
    "musicId": "drix"
  },
  {
    "key": "legende_catcheurs_ethan_riley",
    "type": "Catcheur",
    "rarity": "Legende",
    "name": "Ethan Riley",
    "stats": {
      "Force": 9,
      "Vitesse": 6,
      "Technique": 7,
      "Charisme": 6
    },
    "effect": "Victoire : choisissez la statistique du prochain duel.",
    "ability": "sameStatNext",
    "renderArt": "assets/card_renders/legende_catcheurs_ethan_riley.png",
    "musicId": "ethan_riley"
  },
  {
    "key": "legende_catcheurs_jaydon_ross",
    "type": "Catcheur",
    "rarity": "Legende",
    "name": "Jaydon Ross",
    "stats": {
      "Force": 4,
      "Vitesse": 8,
      "Technique": 6,
      "Charisme": 10
    },
    "effect": "Si ce catcheur perd son premier round, le catcheur suivant gagne +2 en Vitesse sur son premier round",
    "ability": "nextSpeedOnFirstLoss2",
    "renderArt": "assets/card_renders/legende_catcheurs_jaydon_ross.png",
    "musicId": "jaydon_ross"
  },
  {
    "key": "legende_catcheurs_jet_kid",
    "type": "Catcheur",
    "rarity": "Legende",
    "name": "Jet Kid",
    "stats": {
      "Force": 5,
      "Vitesse": 10,
      "Technique": 8,
      "Charisme": 5
    },
    "effect": "Sur son premier round, la roulette a 50% de chance de tomber sur Vitesse.",
    "ability": "speedWheel50",
    "renderArt": "assets/card_renders/legende_catcheurs_jet_kid.png",
    "musicId": "jet_kid"
  },
  {
    "key": "legende_catcheurs_kevin_valdez",
    "type": "Catcheur",
    "rarity": "Legende",
    "name": "Kevin Valdez",
    "stats": {
      "Force": 10,
      "Vitesse": 5,
      "Technique": 5,
      "Charisme": 8
    },
    "effect": "Round 1 : +2 Technique et +2 Vitesse.",
    "ability": "firstRoundSpeedTechnique2",
    "renderArt": "assets/card_renders/legende_catcheurs_kevin_valdez.png",
    "musicId": "kevin_valdez"
  },
  {
    "key": "legende_catcheurs_kyle_hoxton",
    "type": "Catcheur",
    "rarity": "Legende",
    "name": "Kyle Hoxton",
    "stats": {
      "Force": 7,
      "Vitesse": 8,
      "Technique": 6,
      "Charisme": 7
    },
    "effect": "Chaque tour, gagne +3 dans une stat aléatoire.",
    "ability": "turnCatRandom3",
    "renderArt": "assets/card_renders/legende_catcheurs_kyle_hoxton.png",
    "musicId": "kyle_hoxton"
  },
  {
    "key": "legende_catcheurs_mareck",
    "type": "Catcheur",
    "rarity": "Legende",
    "name": "Mareck",
    "stats": {
      "Force": 8,
      "Vitesse": 5,
      "Technique": 8,
      "Charisme": 7
    },
    "effect": "Apparition : Récupérez dans votre main ou jouez une carte objet depuis votre vestiaire.",
    "renderArt": "assets/card_renders/legende_catcheurs_mareck.png",
    "musicId": "mareck"
  },
  {
    "key": "legende_catcheurs_maxime_cuadrado",
    "type": "Catcheur",
    "rarity": "Legende",
    "name": "Maxime Cuadrado",
    "stats": {
      "Force": 6,
      "Vitesse": 6,
      "Technique": 6,
      "Charisme": 10
    },
    "effect": "Adversaire à 2 KO : tombé +40.",
    "ability": "pinBonus40",
    "renderArt": "assets/card_renders/legende_catcheurs_maxime_cuadrado.png",
    "musicId": "maxime_cuadrado"
  },
  {
    "key": "legende_catcheurs_nilsn",
    "type": "Catcheur",
    "rarity": "Legende",
    "name": "Nils'N",
    "stats": {
      "Force": 5,
      "Vitesse": 9,
      "Technique": 6,
      "Charisme": 8
    },
    "effect": "Premier round : +3 Vitesse.",
    "ability": "firstRoundSpeed3",
    "renderArt": "assets/card_renders/legende_catcheurs_nilsn.png",
    "musicId": "nilsn"
  },
  {
    "key": "legende_catcheurs_s_m_s",
    "type": "Catcheur",
    "rarity": "Legende",
    "name": "S.M.S",
    "stats": {
      "Force": 3,
      "Vitesse": 6,
      "Technique": 9,
      "Charisme": 10
    },
    "effect": "Une fois par match, apparition : Regagnez deux tag.",
    "renderArt": "assets/card_renders/legende_catcheurs_s_m_s.png",
    "musicId": "s_m_s",
    "ability": "smsRecoverTags2"
  },
  {
    "key": "legende_catcheurs_saitovic",
    "type": "Catcheur",
    "rarity": "Legende",
    "name": "Saitovic",
    "stats": {
      "Force": 5,
      "Vitesse": 7,
      "Technique": 7,
      "Charisme": 9
    },
    "effect": "Apparition : Récupérez une carte de votre vestiaire. et votre adversaire défausse aléatoirement une carte.",
    "renderArt": "assets/card_renders/legende_catcheurs_saitovic.png",
    "musicId": "saitovic",
    "ability": "recoverGraveDiscard1"
  },
  {
    "key": "legende_catcheurs_shawn_olsen",
    "type": "Catcheur",
    "rarity": "Legende",
    "name": "Shawn Olsen",
    "stats": {
      "Force": 7,
      "Vitesse": 5,
      "Technique": 6,
      "Charisme": 10
    },
    "effect": "1x/match : annule sa 1re défaite, puis +1 Force, Vitesse et Technique.",
    "ability": "firstLossDeck",
    "renderArt": "assets/card_renders/legende_catcheurs_shawn_olsen.png",
    "musicId": "shawn_olsen"
  },
  {
    "key": "legende_catcheurs_tlb",
    "type": "Catcheur",
    "rarity": "Legende",
    "name": "TLB",
    "stats": {
      "Force": 7,
      "Vitesse": 10,
      "Technique": 4,
      "Charisme": 7
    },
    "effect": "S'il remporte un combat, le prochaine catcheur apparaît avec -3 Vitesse.",
    "renderArt": "assets/card_renders/legende_catcheurs_tlb.png",
    "musicId": "tlb",
    "ability": "winNextEnemySpeedMinus3"
  },
  {
    "key": "legende_catcheurs_tyson_briggs",
    "type": "Catcheur",
    "rarity": "Legende",
    "name": "Tyson Briggs",
    "stats": {
      "Force": 9,
      "Vitesse": 6,
      "Technique": 5,
      "Charisme": 8
    },
    "effect": "S'il gagne son premier duel : +1 dans toutes les stats.",
    "ability": "firstWinAll1",
    "renderArt": "assets/card_renders/legende_catcheurs_tyson_briggs.png",
    "musicId": "tyson_briggs"
  },
  {
    "key": "legende_catcheurs_zaeken",
    "type": "Catcheur",
    "rarity": "Legende",
    "name": "Zaeken",
    "stats": {
      "Force": 6,
      "Vitesse": 5,
      "Technique": 10,
      "Charisme": 7
    },
    "effect": "Piochez deux cartes.",
    "ability": "drawOnEntry2",
    "renderArt": "assets/card_renders/legende_catcheurs_zaeken.png",
    "musicId": "zaeken"
  },
  {
    "key": "rare_catcheurs_alex_ezio",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Alex Ezio",
    "stats": {
      "Force": 6,
      "Vitesse": 4,
      "Technique": 6,
      "Charisme": 8
    },
    "effect": "Si ce catcheur est joué au Round 1, il gagne +1 en Charisme et en Technique",
    "ability": "firstRoundCharTech",
    "renderArt": "assets/card_renders/rare_catcheurs_alex_ezio.png",
    "musicId": "alex_ezio"
  },
  {
    "key": "rare_catcheurs_andre_levissieux",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "André Levissieux",
    "stats": {
      "Force": 6,
      "Vitesse": 3,
      "Technique": 7,
      "Charisme": 8
    },
    "effect": "S'il remporte un combat, le prochain catcheur adverse commence avec -2 Technique.",
    "ability": "winNextEnemyTechniqueMinus2",
    "renderArt": "assets/card_renders/rare_catcheurs_andre_levissieux.png",
    "musicId": "andre_levissieux"
  },
  {
    "key": "rare_catcheurs_angelo_folena",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Angelo Folena",
    "stats": {
      "Force": 7,
      "Vitesse": 4,
      "Technique": 6,
      "Charisme": 7
    },
    "effect": "Premier round : +1 Force et +1 Technique.",
    "ability": "firstRoundForceTechnique",
    "renderArt": "assets/card_renders/rare_catcheurs_angelo_folena.png",
    "musicId": "angelo_folena"
  },
  {
    "key": "rare_catcheurs_baadshah_pehalwan_khan",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Baadshah Pehalwan Khan",
    "stats": {
      "Force": 6,
      "Vitesse": 5,
      "Technique": 5,
      "Charisme": 8
    },
    "effect": "S'il gagne, piochez une carte.",
    "ability": "drawOnWin1",
    "renderArt": "assets/card_renders/rare_catcheurs_baadshah_pehalwan_khan.png",
    "musicId": "baadshah_pehalwan_khan"
  },
  {
    "key": "rare_catcheurs_big_sam",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Big Sam",
    "stats": {
      "Force": 10,
      "Vitesse": 2,
      "Technique": 5,
      "Charisme": 7
    },
    "effect": "+20 Tombé et -10 Tombé adverse.",
    "ability": "pinDual20Shield10",
    "renderArt": "assets/card_renders/rare_catcheurs_big_sam.png",
    "musicId": "big_sam"
  },
  {
    "key": "rare_catcheurs_black_sam",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Black Sam",
    "stats": {
      "Force": 9,
      "Vitesse": 3,
      "Technique": 5,
      "Charisme": 7
    },
    "effect": "Arrivée : prochain tombé adverse -10.",
    "ability": "pinShield",
    "renderArt": "assets/card_renders/rare_catcheurs_black_sam.png",
    "musicId": "black_sam"
  },
  {
    "key": "rare_catcheurs_cameron_merchant",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Cameron Merchant",
    "stats": {
      "Force": 8,
      "Vitesse": 4,
      "Technique": 8,
      "Charisme": 4
    },
    "effect": "1x/tour : -1 Force adverse.",
    "ability": "turnEnemyForceMinus1",
    "renderArt": "assets/card_renders/rare_catcheurs_cameron_merchant.png",
    "musicId": "cameron_merchant"
  },
  {
    "key": "rare_catcheurs_camus",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Camus",
    "stats": {
      "Force": 6,
      "Vitesse": 5,
      "Technique": 7,
      "Charisme": 6
    },
    "effect": "Si vous jouez en premier : +1 en Technique et +1 en Charisme.",
    "renderArt": "assets/card_renders/rare_catcheurs_camus.png",
    "musicId": "camus",
    "ability": "starterTechniqueCharisma1"
  },
  {
    "key": "rare_catcheurs_car_crash_gonzo",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Car Crash Gonzo",
    "stats": {
      "Force": 4,
      "Vitesse": 7,
      "Technique": 5,
      "Charisme": 8
    },
    "effect": "Si vous jouez en premier ce tour : +2 Vitesse.",
    "ability": "starterSpeed2",
    "renderArt": "assets/card_renders/rare_catcheurs_car_crash_gonzo.png",
    "musicId": "car_crash_gonzo"
  },
  {
    "key": "rare_catcheurs_charlie_bergson",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Charlie Bergson",
    "stats": {
      "Force": 3,
      "Vitesse": 4,
      "Technique": 7,
      "Charisme": 10
    },
    "effect": "Apparition : Si vous avez Trevor Mayden dans votre vestiaire : +1 en Force, en Technique et en Vitesse.",
    "ability": "entryIfTrevorInGraveFTV1",
    "renderArt": "assets/card_renders/rare_catcheurs_charlie_bergson.png",
    "musicId": "charlie_bergson"
  },
  {
    "key": "rare_catcheurs_christophe_cassagne",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Christophe Cassagne",
    "stats": {
      "Force": 9,
      "Vitesse": 2,
      "Technique": 7,
      "Charisme": 6
    },
    "effect": "Apparition : -2 Force adverse.",
    "ability": "turnEnemyForceMinus2",
    "renderArt": "assets/card_renders/rare_catcheurs_christophe_cassagne.png",
    "musicId": "christophe_cassagne"
  },
  {
    "key": "rare_catcheurs_dadou_bazooka",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Dadou Bazooka",
    "stats": {
      "Force": 7,
      "Vitesse": 5,
      "Technique": 4,
      "Charisme": 8
    },
    "effect": "S'il a un bonus, + 1 en Force et +1 en Vitesse.",
    "ability": "managerOwnedForceSpeed1",
    "renderArt": "assets/card_renders/rare_catcheurs_dadou_bazooka.png",
    "musicId": "dadou_bazooka"
  },
  {
    "key": "rare_catcheurs_dorian_garcia",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Dorian Garcia",
    "stats": {
      "Force": 4,
      "Vitesse": 7,
      "Technique": 5,
      "Charisme": 8
    },
    "effect": "S'il gagne un duel : +1 Vitesse et +1 Charisme.",
    "ability": "winSpeedCharisma1",
    "renderArt": "assets/card_renders/rare_catcheurs_dorian_garcia.png",
    "musicId": "dorian_garcia"
  },
  {
    "key": "rare_catcheurs_drix",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Drix",
    "stats": {
      "Force": 6,
      "Vitesse": 5,
      "Technique": 8,
      "Charisme": 5
    },
    "effect": "Round 1 : +3 Technique.",
    "ability": "techniqueRound1",
    "renderArt": "assets/card_renders/rare_catcheurs_drix.png",
    "musicId": "drix"
  },
  {
    "key": "rare_catcheurs_eddy_marston",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Eddy Marston",
    "stats": {
      "Force": 6,
      "Vitesse": 5,
      "Technique": 6,
      "Charisme": 7
    },
    "effect": "Lorsqu'une carte objet lui est équipée, elle dure deux tours.",
    "renderArt": "assets/card_renders/rare_catcheurs_eddy_marston.png",
    "musicId": "eddy_marston",
    "ability": "objectExtra1"
  },
  {
    "key": "rare_catcheurs_elionis",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Elionis",
    "stats": {
      "Force": 8,
      "Vitesse": 3,
      "Technique": 6,
      "Charisme": 7
    },
    "effect": "Apparition : Votre adversaire défausse une carte de son choix.",
    "renderArt": "assets/card_renders/rare_catcheurs_elionis.png",
    "musicId": "elionis",
    "ability": "opponentDiscardChoice1"
  },
  {
    "key": "rare_catcheurs_ethan_riley",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Ethan Riley",
    "stats": {
      "Force": 8,
      "Vitesse": 5,
      "Technique": 6,
      "Charisme": 5
    },
    "effect": "Victoire : prochain duel sur la même statistique.",
    "ability": "sameStatNextFixed",
    "renderArt": "assets/card_renders/rare_catcheurs_ethan_riley.png",
    "musicId": "ethan_riley"
  },
  {
    "key": "rare_catcheurs_fenrir_strom",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Fenrir Strom",
    "stats": {
      "Force": 8,
      "Vitesse": 5,
      "Technique": 7,
      "Charisme": 4
    },
    "effect": "Round 4 : +1 / Stats.",
    "renderArt": "assets/card_renders/rare_catcheurs_fenrir_strom.png",
    "musicId": "fenrir_strom",
    "ability": "round4All1"
  },
  {
    "key": "rare_catcheurs_jafar_jordan",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Jafar Jordan",
    "stats": {
      "Force": 6,
      "Vitesse": 6,
      "Technique": 6,
      "Charisme": 6
    },
    "effect": "Round 1 : +2 Technique et +2 Charisme.",
    "renderArt": "assets/card_renders/rare_catcheurs_jafar_jordan.png",
    "musicId": "jafar_jordan",
    "ability": "firstRoundCharTech2"
  },
  {
    "key": "rare_catcheurs_jaydon_ross",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Jaydon Ross",
    "stats": {
      "Force": 3,
      "Vitesse": 7,
      "Technique": 5,
      "Charisme": 9
    },
    "effect": "Si ce catcheur perd son premier round, le catcheur suivant gagne +1 en Vitesse sur son premier round",
    "ability": "nextSpeedOnFirstLoss1",
    "renderArt": "assets/card_renders/rare_catcheurs_jaydon_ross.png",
    "musicId": "jaydon_ross"
  },
  {
    "key": "rare_catcheurs_jet_kid",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Jet Kid",
    "stats": {
      "Force": 4,
      "Vitesse": 9,
      "Technique": 7,
      "Charisme": 4
    },
    "effect": "Sur son premier round, la roulette a 25% de chance de tomber sur Vitesse.",
    "ability": "speedWheel25",
    "renderArt": "assets/card_renders/rare_catcheurs_jet_kid.png",
    "musicId": "jet_kid"
  },
  {
    "key": "rare_catcheurs_kevin_avanti",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Kevin Avanti",
    "stats": {
      "Force": 7,
      "Vitesse": 5,
      "Technique": 6,
      "Charisme": 6
    },
    "effect": "Si vous jouez en second : +2 Technique et +2 Charisme.",
    "renderArt": "assets/card_renders/rare_catcheurs_kevin_avanti.png",
    "musicId": "kevin_avanti",
    "ability": "secondPlayerTechniqueCharisma2"
  },
  {
    "key": "rare_catcheurs_kevin_valdez",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Kevin Valdez",
    "stats": {
      "Force": 9,
      "Vitesse": 4,
      "Technique": 4,
      "Charisme": 7
    },
    "effect": "Round 1 : +1 Technique et +1 Vitesse.",
    "ability": "firstRoundSpeedTechnique1",
    "renderArt": "assets/card_renders/rare_catcheurs_kevin_valdez.png",
    "musicId": "kevin_valdez"
  },
  {
    "key": "rare_catcheurs_koro",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Koro",
    "stats": {
      "Force": 4,
      "Vitesse": 8,
      "Technique": 7,
      "Charisme": 5
    },
    "effect": "Apparition : Piochez une carte.",
    "renderArt": "assets/card_renders/rare_catcheurs_koro.png",
    "musicId": "koro",
    "ability": "drawOnEntry1"
  },
  {
    "key": "rare_catcheurs_kyle_hoxton",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Kyle Hoxton",
    "stats": {
      "Force": 6,
      "Vitesse": 7,
      "Technique": 5,
      "Charisme": 6
    },
    "effect": "Chaque tour, gagne +2 dans une stat aléatoire.",
    "ability": "turnCatRandom2",
    "renderArt": "assets/card_renders/rare_catcheurs_kyle_hoxton.png",
    "musicId": "kyle_hoxton"
  },
  {
    "key": "rare_catcheurs_maffa",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Maffa",
    "stats": {
      "Force": 10,
      "Vitesse": 4,
      "Technique": 5,
      "Charisme": 5
    },
    "effect": "Apparition : Prochain tombé +20",
    "renderArt": "assets/card_renders/rare_catcheurs_maffa.png",
    "musicId": "maffa",
    "ability": "entryPinBonus20"
  },
  {
    "key": "rare_catcheurs_mareck",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Mareck",
    "stats": {
      "Force": 7,
      "Vitesse": 4,
      "Technique": 7,
      "Charisme": 6
    },
    "effect": "Apparition : Récupérez une carte de votre vestiaire. et votre adversaire défausse aléatoirement une carte.",
    "renderArt": "assets/card_renders/rare_catcheurs_mareck.png",
    "musicId": "mareck",
    "ability": "recoverGraveDiscard1"
  },
  {
    "key": "rare_catcheurs_max_corleone",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Max Corleone",
    "stats": {
      "Force": 7,
      "Vitesse": 6,
      "Technique": 5,
      "Charisme": 6
    },
    "effect": "S'il possède un bonus : +1 Technique, Force et Vitesse.",
    "ability": "managerOwnedTechForceSpeed1",
    "renderArt": "assets/card_renders/rare_catcheurs_max_corleone.png",
    "musicId": "max_corleone"
  },
  {
    "key": "rare_catcheurs_maxime_cuadrado",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Maxime Cuadrado",
    "stats": {
      "Force": 5,
      "Vitesse": 5,
      "Technique": 5,
      "Charisme": 9
    },
    "effect": "Adversaire à 2 KO : tombé +20.",
    "ability": "pinBonus",
    "renderArt": "assets/card_renders/rare_catcheurs_maxime_cuadrado.png",
    "musicId": "maxime_cuadrado"
  },
  {
    "key": "rare_catcheurs_nilsn",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Nils'N",
    "stats": {
      "Force": 4,
      "Vitesse": 8,
      "Technique": 5,
      "Charisme": 7
    },
    "effect": "Premier round : +2 Vitesse.",
    "ability": "firstRoundSpeed2",
    "renderArt": "assets/card_renders/rare_catcheurs_nilsn.png",
    "musicId": "nilsn"
  },
  {
    "key": "rare_catcheurs_paul_meunier",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Paul Meunier",
    "stats": {
      "Force": 6,
      "Vitesse": 7,
      "Technique": 5,
      "Charisme": 6
    },
    "effect": "1x/match : relance la roulette.",
    "ability": "rerollStat",
    "renderArt": "assets/card_renders/rare_catcheurs_paul_meunier.png",
    "musicId": "paul_meunier"
  },
  {
    "key": "rare_catcheurs_r_man",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "R-MAN",
    "stats": {
      "Force": 5,
      "Vitesse": 3,
      "Technique": 9,
      "Charisme": 7
    },
    "effect": "Une fois par match : +1 à toutes les stats du catcheur suivant.",
    "ability": "nextEntryAll1",
    "renderArt": "assets/card_renders/rare_catcheurs_r_man.png",
    "musicId": "r_man"
  },
  {
    "key": "rare_catcheurs_rayen_gurzil",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Rayen Gurzil",
    "stats": {
      "Force": 7,
      "Vitesse": 5,
      "Technique": 5,
      "Charisme": 7
    },
    "effect": "Round 2 : +3 dans la statistique du duel.",
    "ability": "round2ActiveStat3",
    "renderArt": "assets/card_renders/rare_catcheurs_rayen_gurzil.png",
    "musicId": "rayen_gurzil"
  },
  {
    "key": "rare_catcheurs_romain_lestrange",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Romain Lestrange",
    "stats": {
      "Force": 8,
      "Vitesse": 4,
      "Technique": 6,
      "Charisme": 6
    },
    "effect": "Si vous jouez en second : +1 Force et +1 Charisme.",
    "renderArt": "assets/card_renders/rare_catcheurs_romain_lestrange.png",
    "musicId": "romain_lestrange",
    "ability": "secondPlayerForceCharisma1"
  },
  {
    "key": "rare_catcheurs_rukasu",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "RUKASU",
    "stats": {
      "Force": 6,
      "Vitesse": 6,
      "Technique": 7,
      "Charisme": 5
    },
    "effect": "S'il perd : -2 Technique adverse.",
    "ability": "lossEnemyTechniqueMinus2",
    "renderArt": "assets/card_renders/rare_catcheurs_rukasu.png",
    "musicId": "rukasu"
  },
  {
    "key": "rare_catcheurs_s_m_s",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "S.M.S",
    "stats": {
      "Force": 2,
      "Vitesse": 5,
      "Technique": 7,
      "Charisme": 10
    },
    "effect": "Une fois par match, apparition : Regagnez deux tag.",
    "renderArt": "assets/card_renders/rare_catcheurs_s_m_s.png",
    "musicId": "s_m_s",
    "ability": "smsRecoverTags2"
  },
  {
    "key": "rare_catcheurs_saitovic",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Saitovic",
    "stats": {
      "Force": 4,
      "Vitesse": 6,
      "Technique": 6,
      "Charisme": 8
    },
    "effect": "Apparition : Récupérez une carte de votre vestiaire.",
    "renderArt": "assets/card_renders/rare_catcheurs_saitovic.png",
    "musicId": "saitovic",
    "ability": "recoverGrave"
  },
  {
    "key": "rare_catcheurs_shawn_olsen",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Shawn Olsen",
    "stats": {
      "Force": 6,
      "Vitesse": 5,
      "Technique": 4,
      "Charisme": 9
    },
    "effect": "1x/match : annule sa 1re défaite.",
    "ability": "firstLossDeck",
    "renderArt": "assets/card_renders/rare_catcheurs_shawn_olsen.png",
    "musicId": "shawn_olsen"
  },
  {
    "key": "rare_catcheurs_stan_corey",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Stan Corey",
    "stats": {
      "Force": 5,
      "Vitesse": 6,
      "Technique": 7,
      "Charisme": 6
    },
    "effect": "Si vous jouez en second : +2 Technique.",
    "renderArt": "assets/card_renders/rare_catcheurs_stan_corey.png",
    "musicId": "stan_corey",
    "ability": "secondPlayerTechnique2"
  },
  {
    "key": "rare_catcheurs_thomas_sabia",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Thomas Sabia",
    "stats": {
      "Force": 6,
      "Vitesse": 5,
      "Technique": 7,
      "Charisme": 6
    },
    "effect": "Apparition : Votre adversaire doit vous montrer sa main.",
    "renderArt": "assets/card_renders/rare_catcheurs_thomas_sabia.png",
    "musicId": "thomas_sabia",
    "ability": "revealOpponentHand"
  },
  {
    "key": "rare_catcheurs_tlb",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "TLB",
    "stats": {
      "Force": 6,
      "Vitesse": 9,
      "Technique": 3,
      "Charisme": 6
    },
    "effect": "S'il remporte un combat, le prochaine catcheur apparaît avec -2 Vitesse.",
    "renderArt": "assets/card_renders/rare_catcheurs_tlb.png",
    "musicId": "tlb",
    "ability": "winNextEnemySpeedMinus2"
  },
  {
    "key": "rare_catcheurs_trevor_mayden",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Trevor Mayden",
    "stats": {
      "Force": 8,
      "Vitesse": 6,
      "Technique": 3,
      "Charisme": 7
    },
    "effect": "Une fois par tour, Révélez Charlie Bergson dans votre main : + 1 force et + 20 tombé",
    "ability": "revealCharlieEachRoundForcePin",
    "renderArt": "assets/card_renders/rare_catcheurs_trevor_mayden.png",
    "musicId": "trevor_mayden"
  },
  {
    "key": "rare_catcheurs_tyson_briggs",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Tyson Briggs",
    "stats": {
      "Force": 8,
      "Vitesse": 5,
      "Technique": 4,
      "Charisme": 7
    },
    "effect": "S'il gagne son premier duel : +1 dans toutes les stats.",
    "ability": "firstWinAll1",
    "renderArt": "assets/card_renders/rare_catcheurs_tyson_briggs.png",
    "musicId": "tyson_briggs"
  },
  {
    "key": "rare_catcheurs_zaeken",
    "type": "Catcheur",
    "rarity": "Rare",
    "name": "Zaeken",
    "stats": {
      "Force": 4,
      "Vitesse": 4,
      "Technique": 10,
      "Charisme": 6
    },
    "effect": "Piochez une carte.",
    "ability": "drawOnEntry1",
    "renderArt": "assets/card_renders/rare_catcheurs_zaeken.png",
    "musicId": "zaeken"
  },
  {
    "key": "standard_catcheurs_alex_ezio",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Alex Ezio",
    "stats": {
      "Force": 6,
      "Vitesse": 4,
      "Technique": 6,
      "Charisme": 8
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_alex_ezio.png",
    "musicId": "alex_ezio"
  },
  {
    "key": "standard_catcheurs_angelo_folena",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Angelo Folena",
    "stats": {
      "Force": 7,
      "Vitesse": 4,
      "Technique": 6,
      "Charisme": 7
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_angelo_folena.png",
    "musicId": "angelo_folena"
  },
  {
    "key": "standard_catcheurs_black_sam",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Black Sam",
    "stats": {
      "Force": 9,
      "Vitesse": 3,
      "Technique": 5,
      "Charisme": 7
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_black_sam.png",
    "musicId": "black_sam"
  },
  {
    "key": "standard_catcheurs_car_crash_gonzo",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Car Crash Gonzo",
    "stats": {
      "Force": 4,
      "Vitesse": 7,
      "Technique": 5,
      "Charisme": 8
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_car_crash_gonzo.png",
    "musicId": "car_crash_gonzo"
  },
  {
    "key": "standard_catcheurs_christophe_cassagne",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Christophe Cassagne",
    "stats": {
      "Force": 9,
      "Vitesse": 2,
      "Technique": 7,
      "Charisme": 6
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_christophe_cassagne.png",
    "musicId": "christophe_cassagne"
  },
  {
    "key": "standard_catcheurs_dorian_garcia",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Dorian Garcia",
    "stats": {
      "Force": 4,
      "Vitesse": 7,
      "Technique": 5,
      "Charisme": 8
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_dorian_garcia.png",
    "musicId": "dorian_garcia"
  },
  {
    "key": "standard_catcheurs_drix",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Drix",
    "stats": {
      "Force": 6,
      "Vitesse": 5,
      "Technique": 8,
      "Charisme": 5
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_drix.png",
    "musicId": "drix"
  },
  {
    "key": "standard_catcheurs_elionis",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Elionis",
    "stats": {
      "Force": 8,
      "Vitesse": 3,
      "Technique": 6,
      "Charisme": 7
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_elionis.png",
    "musicId": "elionis"
  },
  {
    "key": "standard_catcheurs_ethan_riley",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Ethan Riley",
    "stats": {
      "Force": 8,
      "Vitesse": 5,
      "Technique": 6,
      "Charisme": 5
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_ethan_riley.png",
    "musicId": "ethan_riley"
  },
  {
    "key": "standard_catcheurs_fenrir_strom",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Fenrir Strom",
    "stats": {
      "Force": 8,
      "Vitesse": 5,
      "Technique": 7,
      "Charisme": 4
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_fenrir_strom.png",
    "musicId": "fenrir_strom"
  },
  {
    "key": "standard_catcheurs_jafar_jordan",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Jafar Jordan",
    "stats": {
      "Force": 6,
      "Vitesse": 6,
      "Technique": 6,
      "Charisme": 6
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_jafar_jordan.png",
    "musicId": "jafar_jordan"
  },
  {
    "key": "standard_catcheurs_jaydon_ross",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Jaydon Ross",
    "stats": {
      "Force": 3,
      "Vitesse": 7,
      "Technique": 5,
      "Charisme": 9
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_jaydon_ross.png",
    "musicId": "jaydon_ross"
  },
  {
    "key": "standard_catcheurs_jet_kid",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Jet Kid",
    "stats": {
      "Force": 4,
      "Vitesse": 9,
      "Technique": 7,
      "Charisme": 4
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_jet_kid.png",
    "musicId": "jet_kid"
  },
  {
    "key": "standard_catcheurs_jey_kill",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Jey Kill",
    "stats": {
      "Force": 7,
      "Vitesse": 4,
      "Technique": 7,
      "Charisme": 6
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_jey_kill.png",
    "musicId": "jey_kill"
  },
  {
    "key": "standard_catcheurs_kevin_avanti",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Kevin Avanti",
    "stats": {
      "Force": 7,
      "Vitesse": 5,
      "Technique": 6,
      "Charisme": 6
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_kevin_avanti.png",
    "musicId": "kevin_avanti"
  },
  {
    "key": "standard_catcheurs_kyle_hoxton",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Kyle Hoxton",
    "stats": {
      "Force": 6,
      "Vitesse": 7,
      "Technique": 5,
      "Charisme": 6
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_kyle_hoxton.png",
    "musicId": "kyle_hoxton"
  },
  {
    "key": "standard_catcheurs_luke_kane",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Luke Kane",
    "stats": {
      "Force": 9,
      "Vitesse": 7,
      "Technique": 2,
      "Charisme": 6
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_luke_kane.png",
    "musicId": "luke_kane"
  },
  {
    "key": "standard_catcheurs_maffa",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Maffa",
    "stats": {
      "Force": 10,
      "Vitesse": 4,
      "Technique": 5,
      "Charisme": 5
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_maffa.png",
    "musicId": "maffa"
  },
  {
    "key": "standard_catcheurs_max_corleone",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Max Corleone",
    "stats": {
      "Force": 7,
      "Vitesse": 6,
      "Technique": 5,
      "Charisme": 6
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_max_corleone.png",
    "musicId": "max_corleone"
  },
  {
    "key": "standard_catcheurs_maxime_cuadrado",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Maxime Cuadrado",
    "stats": {
      "Force": 5,
      "Vitesse": 5,
      "Technique": 5,
      "Charisme": 9
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_maxime_cuadrado.png",
    "musicId": "maxime_cuadrado"
  },
  {
    "key": "standard_catcheurs_nilsn",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Nils'N",
    "stats": {
      "Force": 4,
      "Vitesse": 8,
      "Technique": 5,
      "Charisme": 7
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_nilsn.png",
    "musicId": "nilsn"
  },
  {
    "key": "standard_catcheurs_nocif",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Nocif",
    "stats": {
      "Force": 4,
      "Vitesse": 9,
      "Technique": 4,
      "Charisme": 7
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_nocif.png",
    "musicId": "nocif"
  },
  {
    "key": "standard_catcheurs_paul_meunier",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Paul Meunier",
    "stats": {
      "Force": 6,
      "Vitesse": 7,
      "Technique": 5,
      "Charisme": 6
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_paul_meunier.png",
    "musicId": "paul_meunier"
  },
  {
    "key": "standard_catcheurs_r_man",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "R-MAN",
    "stats": {
      "Force": 5,
      "Vitesse": 3,
      "Technique": 9,
      "Charisme": 7
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_r_man.png",
    "musicId": "r_man"
  },
  {
    "key": "standard_catcheurs_romain_lestrange",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Romain Lestrange",
    "stats": {
      "Force": 8,
      "Vitesse": 4,
      "Technique": 6,
      "Charisme": 6
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_romain_lestrange.png",
    "musicId": "romain_lestrange"
  },
  {
    "key": "standard_catcheurs_rukasu",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "RUKASU",
    "stats": {
      "Force": 6,
      "Vitesse": 6,
      "Technique": 7,
      "Charisme": 5
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_rukasu.png",
    "musicId": "rukasu"
  },
  {
    "key": "standard_catcheurs_shawn_olsen",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Shawn Olsen",
    "stats": {
      "Force": 6,
      "Vitesse": 5,
      "Technique": 4,
      "Charisme": 9
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_shawn_olsen.png",
    "musicId": "shawn_olsen"
  },
  {
    "key": "standard_catcheurs_stan_corey",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Stan Corey",
    "stats": {
      "Force": 5,
      "Vitesse": 6,
      "Technique": 7,
      "Charisme": 6
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_stan_corey.png",
    "musicId": "stan_corey"
  },
  {
    "key": "standard_catcheurs_terry_robinson",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Terry Robinson",
    "stats": {
      "Force": 6,
      "Vitesse": 9,
      "Technique": 5,
      "Charisme": 4
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_terry_robinson.png",
    "musicId": "terry_robinson"
  },
  {
    "key": "standard_catcheurs_tom_desavoy",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Tom Desavoy",
    "stats": {
      "Force": 6,
      "Vitesse": 5,
      "Technique": 4,
      "Charisme": 9
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_tom_desavoy.png",
    "musicId": "tom_desavoy"
  },
  {
    "key": "standard_catcheurs_zaeken",
    "type": "Catcheur",
    "rarity": "Standard",
    "name": "Zaeken",
    "stats": {
      "Force": 4,
      "Vitesse": 4,
      "Technique": 10,
      "Charisme": 6
    },
    "effect": "Aucun effet.",
    "renderArt": "assets/card_renders/standard_catcheurs_zaeken.png",
    "musicId": "zaeken"
  },
  {
    "key": "ultime_catcheurs_tom_la_ruffa",
    "type": "Catcheur",
    "rarity": "Ultime",
    "name": "Tom La Ruffa",
    "stats": {
      "Force": 6,
      "Vitesse": 5,
      "Technique": 8,
      "Charisme": 9
    },
    "effect": "Une fois par partie, lorsqu'il est vaincu, Tom La Ruffa retourne immédiatement sur le ring avec +3 Force et +3 Vitesse.",
    "ability": "bossSecondWind",
    "renderArt": "assets/card_renders/ultime_catcheurs_tom_la_ruffa.png",
    "musicId": "tom_la_ruffa"
  },
  {
    "key": "legende_managers_artemis",
    "type": "Manager",
    "rarity": "Legende",
    "name": "Artemis",
    "stats": {},
    "effect": "Lorsque Artémis est sur le terrain, l'effet des catcheurs adverses est annulé.",
    "renderArt": "assets/card_renders/legende_managers_artemis.png",
    "ability": "cancelOpponentWrestlerEffects"
  },
  {
    "key": "legende_managers_don_alias",
    "type": "Manager",
    "rarity": "Legende",
    "name": "DON ALIAS",
    "stats": {},
    "effect": "Chaque tour : 30% de chance de gagner un point de stat aléatoire de manière permanente.",
    "ability": "turnRandomPermanent30",
    "renderArt": "assets/card_renders/legende_managers_don_alias.png"
  },
  {
    "key": "legende_managers_loic_bloodykilt",
    "type": "Manager",
    "rarity": "Legende",
    "name": "Loïc BLOODYKILT",
    "stats": {},
    "effect": "Premier tour : +1 dans toutes les statistiques.",
    "ability": "mAll1",
    "renderArt": "assets/card_renders/legende_managers_loic_bloodykilt.png"
  },
  {
    "key": "legende_managers_mr_ringsider",
    "type": "Manager",
    "rarity": "Legende",
    "name": "MR Ringsider",
    "stats": {},
    "effect": "Une fois par tour, vous pouvez récupérer deux carte dans votre vestiaire. Si vous le faîtes, Perdez un tag.",
    "renderArt": "assets/card_renders/legende_managers_mr_ringsider.png",
    "ability": "ringsiderRecover2LoseTag"
  },
  {
    "key": "legende_managers_r_man",
    "type": "Manager",
    "rarity": "Legende",
    "name": "R-MAN",
    "stats": {},
    "effect": "Si 3 catcheurs ou plus dans le vestiaire : +2 à toutes les stats.",
    "ability": "mAll2IfGrave3",
    "renderArt": "assets/card_renders/legende_managers_r_man.png"
  },
  {
    "key": "legende_managers_tommy_rauzy",
    "type": "Manager",
    "rarity": "Legende",
    "name": "TOMMY RAUZY",
    "stats": {},
    "effect": "Permet d'utiliser un objet deux fois supplémentaire",
    "ability": "objectExtra2",
    "renderArt": "assets/card_renders/legende_managers_tommy_rauzy.png"
  },
  {
    "key": "legende_managers_yann_le_kersaudec",
    "type": "Manager",
    "rarity": "Legende",
    "name": "YANN LE KERSAUDEC",
    "stats": {},
    "effect": "Annule objets et bonus adverses.",
    "ability": "cancelObjectsManagers",
    "renderArt": "assets/card_renders/legende_managers_yann_le_kersaudec.png"
  },
  {
    "key": "rare_managers_albert_roche",
    "type": "Manager",
    "rarity": "Rare",
    "name": "ALBERT ROCHE",
    "stats": {},
    "effect": "+2 Force.",
    "ability": "mForce",
    "renderArt": "assets/card_renders/rare_managers_albert_roche.png"
  },
  {
    "key": "rare_managers_damien_chevallier",
    "type": "Manager",
    "rarity": "Rare",
    "name": "Damien Chevallier",
    "stats": {},
    "effect": "Une seule fois : Permet de relancer la roulette.",
    "ability": "rerollStat",
    "renderArt": "assets/card_renders/rare_managers_damien_chevallier.png"
  },
  {
    "key": "rare_managers_don_alias",
    "type": "Manager",
    "rarity": "Rare",
    "name": "DON ALIAS",
    "stats": {},
    "effect": "Chaque tour : 20% de chance de gagner un point de stat aléatoire de manière permanente.",
    "ability": "turnRandomPermanent20",
    "renderArt": "assets/card_renders/rare_managers_don_alias.png"
  },
  {
    "key": "rare_managers_edward_minaro",
    "type": "Manager",
    "rarity": "Rare",
    "name": "Edward Minaro",
    "stats": {},
    "effect": "+2 Charisme.",
    "ability": "mCharisme",
    "renderArt": "assets/card_renders/rare_managers_edward_minaro.png"
  },
  {
    "key": "rare_managers_l_odyssee",
    "type": "Manager",
    "rarity": "Rare",
    "name": "L'Odyssée",
    "stats": {},
    "effect": "+1 en Technique et +1 en Force. Si vous jouez Charlie Bergson ou Trevor Mayden, Doublez cet effet.",
    "ability": "bonusOdysseeTechForceTeam",
    "renderArt": "assets/card_renders/rare_managers_l_odyssee.png"
  },
  {
    "key": "rare_managers_loic_bloodykilt",
    "type": "Manager",
    "rarity": "Rare",
    "name": "Loïc BLOODYKILT",
    "stats": {},
    "effect": "Premier tour : +1 dans 2 stats aléatoires.",
    "ability": "mRandom2",
    "renderArt": "assets/card_renders/rare_managers_loic_bloodykilt.png"
  },
  {
    "key": "rare_managers_mr_ringsider",
    "type": "Manager",
    "rarity": "Rare",
    "name": "MR Ringsider",
    "stats": {},
    "effect": "Une fois par tour, vous pouvez récupérer une carte dans votre vestiaire. Si vous le faîtes, Perdez un tag.",
    "renderArt": "assets/card_renders/rare_managers_mr_ringsider.png",
    "ability": "ringsiderRecover1LoseTag"
  },
  {
    "key": "rare_managers_passion_baston",
    "type": "Manager",
    "rarity": "Rare",
    "name": "Passion Baston",
    "stats": {},
    "effect": "+ 1 en Force et +1 en Charisme. Si vous jouez Black Sam ou Angelo Folena, doublez cet effet.",
    "ability": "bonusPassionForceCharTeam",
    "renderArt": "assets/card_renders/rare_managers_passion_baston.png"
  },
  {
    "key": "rare_managers_perfect_fighters_industry",
    "type": "Manager",
    "rarity": "Rare",
    "name": "Perfect Fighters Industry",
    "stats": {},
    "effect": "+ 1 en Charisme et +1 en Vitesse. Si vous jouez Ethan Riley ou Maxime Cuadrado, doublez cet effet.",
    "ability": "bonusPfiCharSpeedTeam",
    "renderArt": "assets/card_renders/rare_managers_perfect_fighters_industry.png"
  },
  {
    "key": "rare_managers_pierreluck",
    "type": "Manager",
    "rarity": "Rare",
    "name": "PierreLuck",
    "stats": {},
    "effect": "Une fois par tour, votre adversaire perd -10 tombé.",
    "renderArt": "assets/card_renders/rare_managers_pierreluck.png",
    "ability": "turnEnemyPinMinus10"
  },
  {
    "key": "rare_managers_pure_tradition",
    "type": "Manager",
    "rarity": "Rare",
    "name": "PURE TRADITION",
    "stats": {},
    "effect": "Chaque tour, piochez une carte. Si vous jouez Romain Lestrange ou Zaeken, l'effet est doublé.",
    "renderArt": "assets/card_renders/rare_managers_pure_tradition.png",
    "ability": "bonusPureTraditionDrawTeam"
  },
  {
    "key": "rare_managers_tommy_rauzy",
    "type": "Manager",
    "rarity": "Rare",
    "name": "TOMMY RAUZY",
    "stats": {},
    "effect": "Permet d'utiliser un objet une fois supplémentaire",
    "ability": "objectExtra1",
    "renderArt": "assets/card_renders/rare_managers_tommy_rauzy.png"
  },
  {
    "key": "rare_managers_yann_le_kersaudec",
    "type": "Manager",
    "rarity": "Rare",
    "name": "YANN LE KERSAUDEC",
    "stats": {},
    "effect": "Annule les objets adverses.",
    "ability": "cancelObjects",
    "renderArt": "assets/card_renders/rare_managers_yann_le_kersaudec.png"
  },
  {
    "key": "standard_managers_albert_roche",
    "type": "Manager",
    "rarity": "Standard",
    "name": "ALBERT ROCHE",
    "stats": {},
    "effect": "+1 Force.",
    "ability": "mForce1",
    "renderArt": "assets/card_renders/standard_managers_albert_roche.png"
  },
  {
    "key": "standard_managers_don_alias",
    "type": "Manager",
    "rarity": "Standard",
    "name": "DON ALIAS",
    "stats": {},
    "effect": "Chaque tour : 10% de chance de gagner un point de stat aléatoire de manière permanente.",
    "ability": "turnRandomPermanent10",
    "renderArt": "assets/card_renders/standard_managers_don_alias.png"
  },
  {
    "key": "standard_managers_edward_minaro",
    "type": "Manager",
    "rarity": "Standard",
    "name": "Edward Minaro",
    "stats": {},
    "effect": "+1 Charisme.",
    "ability": "mCharisme1",
    "renderArt": "assets/card_renders/standard_managers_edward_minaro.png"
  },
  {
    "key": "standard_managers_loic_bloodykilt",
    "type": "Manager",
    "rarity": "Standard",
    "name": "Loïc BLOODYKILT",
    "stats": {},
    "effect": "Premier tour : +1 dans 1 stat aléatoire.",
    "ability": "mRandom",
    "renderArt": "assets/card_renders/standard_managers_loic_bloodykilt.png"
  },
  {
    "key": "standard_managers_yann_le_kersaudec",
    "type": "Manager",
    "rarity": "Standard",
    "name": "YANN LE KERSAUDEC",
    "stats": {},
    "effect": "Annule tous les objets.",
    "ability": "cancelAllObjects",
    "renderArt": "assets/card_renders/standard_managers_yann_le_kersaudec.png"
  },
  {
    "key": "legende_objets_ceinture_de_champion",
    "type": "Objet",
    "rarity": "Legende",
    "name": "Ceinture de champion",
    "stats": {},
    "effect": "+ 3 à toutes les stats.",
    "ability": "mAll3",
    "renderArt": "assets/card_renders/legende_objets_ceinture_de_champion.png"
  },
  {
    "key": "legende_objets_malette",
    "type": "Objet",
    "rarity": "Legende",
    "name": "Malette",
    "stats": {},
    "effect": "+ 2 Charisme ou +20 Tombé.",
    "ability": "pinObject20",
    "renderArt": "assets/card_renders/legende_objets_malette.png"
  },
  {
    "key": "rare_objets_caddie",
    "type": "Objet",
    "rarity": "Rare",
    "name": "Caddie",
    "stats": {},
    "effect": "Prochain tour : +1 pioche.",
    "ability": "drawNext1",
    "renderArt": "assets/card_renders/rare_objets_caddie.png"
  },
  {
    "key": "rare_objets_cloche",
    "type": "Objet",
    "rarity": "Rare",
    "name": "Cloche",
    "stats": {},
    "effect": "+1 dans deux stats aléatoires.",
    "ability": "mRandom2",
    "renderArt": "assets/card_renders/rare_objets_cloche.png"
  },
  {
    "key": "rare_objets_extincteur",
    "type": "Objet",
    "rarity": "Rare",
    "name": "Extincteur",
    "stats": {},
    "effect": "Récupérez une carte dans votre vestiaire.",
    "ability": "recoverGrave",
    "renderArt": "assets/card_renders/rare_objets_extincteur.png"
  },
  {
    "key": "rare_objets_micro",
    "type": "Objet",
    "rarity": "Rare",
    "name": "Micro",
    "stats": {},
    "effect": "+2 Charisme.",
    "ability": "mCharisme",
    "renderArt": "assets/card_renders/rare_objets_micro.png"
  },
  {
    "key": "rare_objets_poubelle",
    "type": "Objet",
    "rarity": "Rare",
    "name": "Poubelle",
    "stats": {},
    "effect": "Votre adversaire défausse une carte.",
    "ability": "opponentDiscard1",
    "renderArt": "assets/card_renders/rare_objets_poubelle.png"
  },
  {
    "key": "standard_objets_barriere",
    "type": "Objet",
    "rarity": "Standard",
    "name": "Barrière",
    "stats": {},
    "effect": "- 5 Tombé adverse.",
    "ability": "pinShield5",
    "renderArt": "assets/card_renders/standard_objets_barriere.png"
  },
  {
    "key": "standard_objets_chaise",
    "type": "Objet",
    "rarity": "Standard",
    "name": "Chaise",
    "stats": {},
    "effect": "+1 Force.",
    "ability": "mForce1",
    "renderArt": "assets/card_renders/standard_objets_chaise.png"
  },
  {
    "key": "standard_objets_echelle",
    "type": "Objet",
    "rarity": "Standard",
    "name": "Echelle",
    "stats": {},
    "effect": "+1 en Vitesse.",
    "ability": "mVitesse1",
    "renderArt": "assets/card_renders/standard_objets_echelle.png"
  },
  {
    "key": "standard_objets_table",
    "type": "Objet",
    "rarity": "Standard",
    "name": "Table",
    "stats": {},
    "effect": "Victoire : Tombé +5.",
    "ability": "pinObject5",
    "renderArt": "assets/card_renders/standard_objets_table.png"
  },
  {
    "key": "standard_catcheurs_boume", "type": "Catcheur", "rarity": "Standard", "name": "Boumé",
    "stats": { "Force": 3, "Vitesse": 5, "Technique": 10, "Charisme": 6 }, "effect": "",
    "renderArt": "assets/card_renders/standard_catcheurs_boume.png"
  },
  {
    "key": "rare_catcheurs_caiman_jr", "type": "Catcheur", "rarity": "Rare", "name": "Caïman Jr",
    "stats": { "Force": 8, "Vitesse": 7, "Technique": 6, "Charisme": 3 }, "effect": "Chaque tour : -1 Vitesse adverse.", "ability": "turnEnemySpeedMinus1",
    "renderArt": "assets/card_renders/rare_catcheurs_caiman_jr.png"
  },
  {
    "key": "rare_catcheurs_dan_nocas", "type": "Catcheur", "rarity": "Rare", "name": "Dan Nocas",
    "stats": { "Force": 5, "Vitesse": 4, "Technique": 7, "Charisme": 8 }, "effect": "À l'arrivée, si The Butcher Zerk est en main : l'adversaire défausse 1 carte.", "ability": "entryIfZerkInHandDiscard1",
    "renderArt": "assets/card_renders/rare_catcheurs_dan_nocas.png"
  },
  {
    "key": "standard_catcheurs_dario_murro", "type": "Catcheur", "rarity": "Standard", "name": "Dario Murro",
    "stats": { "Force": 8, "Vitesse": 6, "Technique": 5, "Charisme": 5 }, "effect": "",
    "renderArt": "assets/card_renders/standard_catcheurs_dario_murro.png"
  },
  {
    "key": "rare_catcheurs_dario_murro", "type": "Catcheur", "rarity": "Rare", "name": "Dario Murro",
    "stats": { "Force": 8, "Vitesse": 6, "Technique": 5, "Charisme": 5 }, "effect": "À l'arrivée : piochez 1 carte.", "ability": "drawOnEntry1",
    "renderArt": "assets/card_renders/rare_catcheurs_dario_murro.png"
  },
  {
    "key": "rare_catcheurs_heracles", "type": "Catcheur", "rarity": "Rare", "name": "Héraclès",
    "stats": { "Force": 10, "Vitesse": 4, "Technique": 5, "Charisme": 5 }, "effect": "À l'arrivée : choisissez un bonus dans le deck et ajoutez-le à votre main.", "ability": "tutorManagerFromDeck",
    "renderArt": "assets/card_renders/rare_catcheurs_heracles.png"
  },
  {
    "key": "legende_catcheurs_heracles", "type": "Catcheur", "rarity": "Legende", "name": "Héraclès",
    "stats": { "Force": 10, "Vitesse": 5, "Technique": 6, "Charisme": 7 }, "effect": "À l'arrivée : choisissez un bonus et un objet dans le deck et ajoutez-les à votre main.", "ability": "tutorManagerObjectFromDeck",
    "renderArt": "assets/card_renders/legende_catcheurs_heracles.png"
  },
  {
    "key": "standard_catcheurs_lucas_menil", "type": "Catcheur", "rarity": "Standard", "name": "Lucas Menil",
    "stats": { "Force": 6, "Vitesse": 5, "Technique": 7, "Charisme": 6 }, "effect": "", "musicId": "lucas_menil",
    "renderArt": "assets/card_renders/standard_catcheurs_lucas_menil.png"
  },
  {
    "key": "rare_catcheurs_lucas_menil", "type": "Catcheur", "rarity": "Rare", "name": "Lucas Menil",
    "stats": { "Force": 6, "Vitesse": 5, "Technique": 7, "Charisme": 6 }, "effect": "Chaque tour : +1 dans une stat aléatoire, cumulable 5 fois.", "ability": "turnCatRandomPermanent1Max5", "musicId": "lucas_menil",
    "renderArt": "assets/card_renders/rare_catcheurs_lucas_menil.png"
  },
  {
    "key": "legende_catcheurs_lucas_menil", "type": "Catcheur", "rarity": "Legende", "name": "Lucas Menil",
    "stats": { "Force": 7, "Vitesse": 6, "Technique": 8, "Charisme": 7 }, "effect": "Chaque tour : +2 dans une stat aléatoire, cumulable 3 fois.", "ability": "turnCatRandomPermanent2Max3", "musicId": "lucas_menil",
    "renderArt": "assets/card_renders/legende_catcheurs_lucas_menil.png"
  },
  {
    "key": "rare_managers_ludovic_vaillant", "type": "Manager", "rarity": "Rare", "name": "Ludovic Vaillant", "stats": {},
    "effect": "Tant qu'il est actif, jouer un bonus ou un objet force l'adversaire à défausser 1 carte.", "ability": "opponentDiscardOnSupport",
    "renderArt": "assets/card_renders/rare_managers_ludovic_vaillant.png"
  },
  {
    "key": "rare_catcheurs_leon", "type": "Catcheur", "rarity": "Rare", "name": "Léon",
    "stats": { "Force": 8, "Vitesse": 4, "Technique": 6, "Charisme": 6 }, "effect": "À l'arrivée : récupérez un objet depuis votre vestiaire.", "ability": "recoverObjectGrave", "musicId": "leon",
    "renderArt": "assets/card_renders/rare_catcheurs_leon.png"
  },
  {
    "key": "rare_objets_ringside_apparel", "type": "Objet", "rarity": "Rare", "name": "Ringside Apparel", "stats": {},
    "effect": "+2 Charisme, -1 Vitesse.", "ability": "mCharisma2SpeedMinus1",
    "renderArt": "assets/card_renders/rare_objets_ringside_apparel.png"
  },
  {
    "key": "standard_catcheurs_the_butcher_zerk", "type": "Catcheur", "rarity": "Standard", "name": "The Butcher Zerk",
    "stats": { "Force": 10, "Vitesse": 2, "Technique": 7, "Charisme": 5 }, "effect": "", "musicId": "the_butcher_zerk",
    "renderArt": "assets/card_renders/standard_catcheurs_the_butcher_zerk.png"
  },
  {
    "key": "rare_catcheurs_the_butcher_zerk", "type": "Catcheur", "rarity": "Rare", "name": "The Butcher Zerk",
    "stats": { "Force": 10, "Vitesse": 2, "Technique": 7, "Charisme": 5 }, "effect": "Chaque tour, si Dan Nocas est en main : +2 Technique et +2 Vitesse.", "ability": "revealDanEachRoundTechSpeed2", "musicId": "the_butcher_zerk",
    "renderArt": "assets/card_renders/rare_catcheurs_the_butcher_zerk.png"
  },
  {
    "key": "rare_catcheurs_matheo_navarro", "type": "Catcheur", "rarity": "Rare", "name": "Matheo Navarro",
    "stats": { "Force": 4, "Vitesse": 7, "Technique": 5, "Charisme": 8 }, "effect": "S'il est joue au premier round : +3 Vitesse.", "ability": "firstRoundSpeed3", "musicId": "matheo_navarro",
    "renderArt": "assets/card_renders/rare_catcheurs_matheo_navarro.png"
  },
  {
    "key": "legende_catcheurs_matheo_navarro", "type": "Catcheur", "rarity": "Legende", "name": "Matheo Navarro",
    "stats": { "Force": 5, "Vitesse": 8, "Technique": 6, "Charisme": 9 }, "effect": "S'il est joue au premier round : +2 Vitesse et +2 Force.", "ability": "firstRoundForceSpeed2", "musicId": "matheo_navarro",
    "renderArt": "assets/card_renders/legende_catcheurs_matheo_navarro.png"
  },
  {
    "key": "rare_catcheurs_osvaldo", "type": "Catcheur", "rarity": "Rare", "name": "Osvaldo",
    "stats": { "Force": 5, "Vitesse": 7, "Technique": 7, "Charisme": 5 }, "effect": "Premier round : +1 Vitesse et +1 Force.", "ability": "firstRoundForceSpeed1", "musicId": "osvaldo",
    "renderArt": "assets/card_renders/rare_catcheurs_osvaldo.png"
  },
  {
    "key": "standard_catcheurs_osvaldo", "type": "Catcheur", "rarity": "Standard", "name": "Osvaldo",
    "stats": { "Force": 5, "Vitesse": 7, "Technique": 7, "Charisme": 5 }, "effect": "", "musicId": "osvaldo",
    "renderArt": "assets/card_renders/standard_catcheurs_osvaldo.png"
  },
  {
    "key": "ultime_catcheurs_princesse_lauriana", "type": "Catcheur", "rarity": "Ultime", "name": "Princesse Lauriana",
    "stats": { "Force": 9, "Vitesse": 4, "Technique": 7, "Charisme": 8 }, "effect": "Apparition : piochez jusqu'a avoir 6 cartes en main. Gagnez un point aleatoire par carte bonus tiree par cet effet.", "ability": "drawToSixBonusStats", "musicId": "princesse_lauriana",
    "renderArt": "assets/card_renders/ultime_catcheurs_princesse_lauriana.png"
  },
  {
    "key": "rare_catcheurs_tom_evans", "type": "Catcheur", "rarity": "Rare", "name": "Tom Evans",
    "stats": { "Force": 7, "Vitesse": 8, "Technique": 5, "Charisme": 4 }, "effect": "Apparition : recuperez un Jaydon Ross ou un Fenrir Strom depuis votre deck ou vestiaire.", "ability": "recoverJaydonOrFenrir", "musicId": "tom_evans",
    "renderArt": "assets/card_renders/rare_catcheurs_tom_evans.png"
  },
  {
    "key": "standard_catcheurs_tom_evans", "type": "Catcheur", "rarity": "Standard", "name": "Tom Evans",
    "stats": { "Force": 7, "Vitesse": 8, "Technique": 5, "Charisme": 4 }, "effect": "", "musicId": "tom_evans",
    "renderArt": "assets/card_renders/standard_catcheurs_tom_evans.png"
  },
  {
    "key": "rare_catcheurs_ace_angel", "type": "Catcheur", "rarity": "Rare", "name": "Ace Angel",
    "stats": { "Force": 6, "Vitesse": 8, "Technique": 6, "Charisme": 4 }, "effect": "Apparition : revelez un objet dans votre main, gagnez +2 Charisme et +1 Vitesse.", "ability": "revealObjectHandCharSpeed", "musicId": "ace_angel",
    "renderArt": "assets/card_renders/rare_catcheurs_ace_angel.png"
  },
  {
    "key": "standard_catcheurs_el_amnesico", "type": "Catcheur", "rarity": "Standard", "name": "El Amnesico",
    "stats": { "Force": 4, "Vitesse": 8, "Technique": 6, "Charisme": 6 }, "effect": "", "musicId": "el_amnesico",
    "renderArt": "assets/card_renders/standard_catcheurs_el_amnesico.png"
  },
  {
    "key": "rare_catcheurs_el_amnesico", "type": "Catcheur", "rarity": "Rare", "name": "El Amnesico",
    "stats": { "Force": 4, "Vitesse": 8, "Technique": 6, "Charisme": 6 }, "effect": "Tant que cette carte est sur le terrain, 20% de chance que la roulette se relance automatiquement.", "ability": "wheelAutoReroll20", "musicId": "el_amnesico",
    "renderArt": "assets/card_renders/rare_catcheurs_el_amnesico.png"
  },
  {
    "key": "ultime_catcheurs_heddi_karaoui", "type": "Catcheur", "rarity": "Ultime", "name": "Heddi Karaoui",
    "stats": { "Force": 7, "Vitesse": 4, "Technique": 10, "Charisme": 7 }, "effect": "Tant que cette carte est sur le terrain, 75% de chance en plus que la roulette s'arrete sur Technique.", "ability": "techniqueWheel75", "musicId": "heddi_karaoui",
    "renderArt": "assets/card_renders/ultime_catcheurs_heddi_karaoui.png"
  },
  {
    "key": "rare_catcheurs_jose_moreno", "type": "Catcheur", "rarity": "Rare", "name": "Jose Moreno",
    "stats": { "Force": 4, "Vitesse": 9, "Technique": 4, "Charisme": 7 }, "effect": "Premier tour : votre adversaire envoie la carte au-dessus de son deck au vestiaire.", "ability": "firstRoundOpponentMill1", "musicId": "jose_moreno",
    "renderArt": "assets/card_renders/rare_catcheurs_jose_moreno.png"
  }
];

function cardKey(card){
  return card?.key || `${String(card?.rarity||"standard").toLowerCase()}_${String(card?.type||"carte").toLowerCase()}_${String(card?.name||"carte").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"")}`;
}

function displayCardType(type){
  return type==="Manager" ? "Bonus" : type;
}

function displayEffectText(text){
  return String(text||"")
    .replace(/\bMANAGERS\b/g,"BONUS")
    .replace(/\bMANAGER\b/g,"BONUS")
    .replace(/\bManagers\b/g,"Bonus")
    .replace(/\bManager\b/g,"Bonus")
    .replace(/\bmanagers\b/g,"bonus")
    .replace(/\bmanager\b/g,"bonus");
}

function cloneCard(card){
  return card ? JSON.parse(JSON.stringify(card)) : null;
}

function cardByKey(key){return CARD_DATA.find(c=>cardKey(c)===key)||CARD_DATA.find(c=>c.name===key)||null}
function normalizeDeckCards(cards){
  const source=Array.isArray(cards)?cards:CARD_DATA.map(cardKey);
  return source.map(key=>cardByKey(key)).filter(Boolean).map(cardKey);
}
function legalDeckKeys(keys, maxCards=20){
  const used={};
  const rarityCount={Rare:0,Legende:0};
  const rarityLimit={Rare:8,Legende:3};
  const result=[];
  normalizeDeckCards(keys).forEach(key=>{
    if(result.length>=maxCards)return;
    const card=cardByKey(key);
    if(!card)return;
    if((used[key]||0)>=2)return;
    if(rarityLimit[card.rarity] && rarityCount[card.rarity]>=rarityLimit[card.rarity])return;
    result.push(key);
    used[key]=(used[key]||0)+1;
    if(rarityLimit[card.rarity])rarityCount[card.rarity]++;
  });
  return result;
}

const EFFECT_REGISTRY = {
  bossSecondWind: { timing:"defeat", text:"Une fois par partie, retour immédiat sur le ring avec +3 Force et +3 Vitesse." },
  cancelObjects: { timing:"entry", text:"Annule les objets adverses actifs." },
  cancelAllObjects: { timing:"entry", text:"Annule tous les objets actifs." },
  cancelOpponentWrestlerEffects: { timing:"manager", text:"Annule les effets des catcheurs adverses tant que ce bonus est actif." },
  bonusOdysseeTechForceTeam: { timing:"manager", text:"+1 Technique et +1 Force. Doublé avec Charlie Bergson ou Trevor Mayden." },
  bonusPassionForceCharTeam: { timing:"manager", text:"+1 Force et +1 Charisme. Doublé avec Black Sam ou Angelo Folena." },
  bonusPfiCharSpeedTeam: { timing:"manager", text:"+1 Charisme et +1 Vitesse. Doublé avec Ethan Riley ou Maxime Cuadrado." },
  cancelObjectsManagers: { timing:"entry", text:"Annule objets et bonus adverses." },
  drawNext1: { timing:"object", text:"La prochaine pioche gagne +1 carte." },
  drawOnEntry1: { timing:"entry", text:"Pioche 1 carte à l'arrivée." },
  drawOnEntry2: { timing:"entry", text:"Pioche 2 cartes à l'arrivée." },
  drawOnWin1: { timing:"win", text:"Pioche 1 carte après une victoire de duel." },
  drawOnWin2: { timing:"win", text:"Pioche 2 cartes après une victoire de duel." },
  entryIfTrevorInGraveFTV1: { timing:"entry", text:"Si Trevor Mayden est au vestiaire : +1 Force, Technique et Vitesse." },
  entryIfZerkInHandDiscard1: { timing:"entry", text:"Si The Butcher Zerk est en main : l'adversaire défausse 1 carte." },
  firstLossDeck: { timing:"defeat", text:"Une fois par match, annule la première défaite et retourne dans le deck." },
  firstRoundCharTech: { timing:"round1", text:"+1 Charisme et +1 Technique au round 1." },
  firstRoundCharTech2: { timing:"round1", text:"+2 Charisme et +2 Technique au round 1." },
  firstRoundForceCharTech: { timing:"round1", text:"+1 Force, Technique et Charisme au round 1." },
  firstRoundForceTechnique: { timing:"round1", text:"+1 Force et +1 Technique au premier round." },
  firstRoundForceSpeed1: { timing:"firstRound", text:"+1 Force et +1 Vitesse au premier round de la carte." },
  firstRoundForceSpeed2: { timing:"firstRound", text:"+2 Force et +2 Vitesse au premier round de la carte." },
  firstRoundOpponentMill1: { timing:"entry", text:"Envoie la carte au-dessus du deck adverse au vestiaire." },
  firstRoundSpeed2: { timing:"firstRound", text:"+2 Vitesse au premier round de la carte." },
  firstRoundSpeed3: { timing:"firstRound", text:"+3 Vitesse au premier round de la carte." },
  firstRoundSpeedCharisma3: { timing:"round1", text:"+3 Vitesse et +3 Charisme au round 1." },
  firstRoundSpeedTechnique1: { timing:"round1", text:"+1 Vitesse et +1 Technique au round 1." },
  firstRoundSpeedTechnique2: { timing:"round1", text:"+2 Vitesse et +2 Technique au round 1." },
  firstWinAll1: { timing:"win", text:"Première victoire : +1 à toutes les stats." },
  drawToSixBonusStats: { timing:"entry", text:"Pioche jusqu'à six cartes et gagne +1 stat aléatoire par bonus ainsi pioché." },
  lossEnemyTechniqueMinus2: { timing:"loss", text:"Après une défaite, -2 Technique au vainqueur." },
  mAll1: { timing:"manager", text:"+1 à toutes les stats." },
  mAll2IfGrave3: { timing:"manager", text:"Si 3 catcheurs ou plus au vestiaire : +2 partout." },
  mAll3: { timing:"object", text:"+3 à toutes les stats." },
  mCharisme: { timing:"manager", text:"+1 Charisme." },
  mCharisme1: { timing:"manager", text:"+1 Charisme." },
  mCharisme3: { timing:"manager", text:"+3 Charisme." },
  mCharisma2SpeedMinus1: { timing:"object", text:"+2 Charisme et -1 Vitesse." },
  mForce: { timing:"manager", text:"+1 Force." },
  mForce1: { timing:"manager", text:"+1 Force." },
  mForce3: { timing:"manager", text:"+3 Force." },
  mRandom: { timing:"manager", text:"+1 dans une stat aléatoire." },
  mRandom2: { timing:"manager", text:"+2 dans une stat aléatoire." },
  mVitesse1: { timing:"manager", text:"+1 Vitesse." },
  managerOwnedForceSpeed1: { timing:"duel", text:"Si un bonus est actif : +1 Force et +1 Vitesse." },
  managerOwnedTechForceSpeed1: { timing:"duel", text:"Si un bonus est actif : +1 Technique, Force et Vitesse." },
  nextEntryAll1: { timing:"defeat", text:"Une fois par match, le prochain catcheur gagne +1 partout." },
  nextSpeedOnFirstLoss1: { timing:"firstLoss", text:"Si la carte perd son premier round, prochain catcheur +1 Vitesse." },
  nextSpeedOnFirstLoss2: { timing:"firstLoss", text:"Si la carte perd son premier round, prochain catcheur +2 Vitesse." },
  objectExtra1: { timing:"manager", text:"Les objets durent 1 tour supplémentaire." },
  objectExtra2: { timing:"manager", text:"Les objets durent 2 tours supplémentaires." },
  opponentDiscard1: { timing:"object", text:"L'adversaire défausse 1 carte." },
  opponentDiscardChoice1: { timing:"entry", text:"L'adversaire défausse 1 carte de son choix.", choice:true },
  opponentDiscardOnSupport: { timing:"manager", text:"Chaque bonus ou objet adverse force une défausse." },
  pinBonus: { timing:"pin", text:"Si l'adversaire a au moins 2 KO : tombé +20." },
  pinBonus40: { timing:"pin", text:"Si l'adversaire a au moins 2 KO : tombé +40." },
  pinDual20Shield10: { timing:"entry", text:"+20 Tombé et -10 au prochain tombé adverse." },
  pinObject20: { timing:"object", text:"+2 Charisme ou +20 Tombé.", choice:true },
  pinObject5: { timing:"object", text:"Tombé +5." },
  pinShield: { timing:"entry", text:"Prochain tombé adverse -10." },
  pinShield20: { timing:"entry", text:"Prochain tombé adverse -20." },
  pinShield5: { timing:"object", text:"Prochain tombé adverse -5." },
  recoverGrave: { timing:"object", text:"Récupère une carte du vestiaire." },
  recoverGraveDiscard1: { timing:"entry", text:"À l'arrivée : récupère une carte du vestiaire et l'adversaire défausse une carte aléatoire." },
  recoverObjectGrave: { timing:"entry", text:"À l'arrivée : récupère un objet du vestiaire." },
  recoverJaydonOrFenrir: { timing:"entry", choice:true, text:"Récupère Jaydon Ross ou Fenrir Strom depuis le deck ou le vestiaire." },
  revealObjectHandCharSpeed: { timing:"entry", text:"Révélez un objet en main : +2 Charisme et +1 Vitesse." },
  revealOpponentHand: { timing:"entry", text:"À l'arrivée : révèle la main adverse." },
  revealCharlieEachRoundForcePin: { timing:"round", text:"Une fois par tour, si Charlie Bergson est en main : +1 Force et +20 Tombé." },
  rerollStat: { timing:"roulette", text:"Relance la statistique du duel une fois." },
  ringsiderRecover1LoseTag: { timing:"round", text:"Une fois par tour : récupère 1 carte du vestiaire et perd 1 TAG." },
  ringsiderRecover2LoseTag: { timing:"round", text:"Une fois par tour : récupère 2 cartes du vestiaire et perd 1 TAG." },
  round4All1: { timing:"round4", text:"Round 4 : +1 à toutes les stats." },
  round2ActiveStat3: { timing:"duel", text:"À partir du round 2 : +3 dans la stat active." },
  sameStatNext: { timing:"win", text:"Verrouille la statistique du prochain duel.", choice:true },
  sameStatNextFixed: { timing:"win", text:"Verrouille la statistique du duel gagné pour le prochain duel." },
  secondPlayerTechnique2: { timing:"duel", text:"Si joué en second : +2 Technique." },
  secondPlayerForceCharisma1: { timing:"duel", text:"Si joué en second : +1 Force et +1 Charisme." },
  secondPlayerTechniqueCharisma2: { timing:"duel", text:"Si joué en second : +2 Technique et +2 Charisme." },
  smsRecoverTags2: { timing:"entry", text:"Une fois par match : regagne jusqu'à 2 TAG." },
  speedWheel25: { timing:"roulette", text:"Premier round : 25% de chance de forcer Vitesse." },
  speedWheel50: { timing:"roulette", text:"Premier round : 50% de chance de forcer Vitesse." },
  techniqueWheel75: { timing:"roulette", text:"75% de chance de forcer Technique." },
  wheelAutoReroll20: { timing:"roulette", text:"20% de chance de relancer automatiquement la roulette." },
  starterTechniqueCharisma1: { timing:"entry", text:"Si joué en premier ce tour : +1 Technique et +1 Charisme." },
  starterSpeed2: { timing:"duel", text:"Si joué en premier ce tour : +2 Vitesse." },
  starterSpeedTechnique2: { timing:"duel", text:"Si joué en premier ce tour : +2 Vitesse et +2 Technique." },
  techniqueRound1: { timing:"round1", text:"Round 1 : +3 Technique." },
  turnCatRandom2: { timing:"round", text:"Chaque tour : +2 dans une stat aléatoire, non cumulatif." },
  turnCatRandom3: { timing:"round", text:"Chaque tour : +3 dans une stat aléatoire, non cumulatif." },
  turnCatRandomPermanent1Max5: { timing:"round", text:"Chaque tour : +1 dans une stat aléatoire, cumulable 5 fois." },
  turnCatRandomPermanent2Max3: { timing:"round", text:"Chaque tour : +2 dans une stat aléatoire, cumulable 3 fois." },
  turnEnemyForceMinus1: { timing:"round", text:"Chaque tour : -1 Force adverse." },
  turnEnemyForceMinus2: { timing:"round", text:"Chaque tour : -2 Force adverse." },
  turnEnemySpeedMinus1: { timing:"round", text:"Chaque tour : -1 Vitesse adverse." },
  turnEnemyPinMinus10: { timing:"round", text:"Chaque tour : prochain tombé adverse -10." },
  turnRandomPermanent10: { timing:"round", text:"Chaque tour : 10% de chance de +1 stat permanent." },
  turnRandomPermanent20: { timing:"round", text:"Chaque tour : 20% de chance de +1 stat permanent." },
  turnRandomPermanent30: { timing:"round", text:"Chaque tour : 30% de chance de +1 stat permanent." },
  entryPinBonus20: { timing:"entry", text:"À l'arrivée : prochain tombé +20." },
  tutorManagerFromDeck: { timing:"entry", text:"À l'arrivée : choisissez un bonus dans le deck." },
  tutorManagerObjectFromDeck: { timing:"entry", text:"À l'arrivée : choisissez un bonus et un objet dans le deck." },
  revealDanEachRoundTechSpeed2: { timing:"round", text:"Chaque tour, si Dan Nocas est en main : +2 Technique et +2 Vitesse." },
  bonusPureTraditionDrawTeam: { timing:"manager", text:"Chaque tour : pioche 1 carte. Doublé avec Romain Lestrange ou Zaeken." },
  winNextEnemyTechniqueMinus2: { timing:"win", text:"Après victoire : prochain catcheur adverse -2 Technique." },
  winNextEnemyTechniqueMinus3: { timing:"win", text:"Après victoire : prochain catcheur adverse -3 Technique." },
  winNextEnemySpeedMinus2: { timing:"win", text:"Après victoire : prochain catcheur adverse -2 Vitesse." },
  winNextEnemySpeedMinus3: { timing:"win", text:"Après victoire : prochain catcheur adverse -3 Vitesse." },
  winSpeedCharisma1: { timing:"win", text:"Après victoire : +1 Vitesse et +1 Charisme." }
};

function runAllstarAudit(){
  const errors=[];
  const warnings=[];
  const info=[];
  const keys=new Map();
  CARD_DATA.forEach(card=>{
    const key=cardKey(card);
    if(keys.has(key))errors.push(`Clé dupliquée : ${key} (${keys.get(key).name} / ${card.name})`);
    keys.set(key,card);
    if(card.ability&&!EFFECT_REGISTRY[card.ability])errors.push(`${card.name} ${card.rarity} : effet introuvable "${card.ability}".`);
    if(card.type==="Catcheur"&&card.rarity==="Standard"&&card.ability)errors.push(`${card.name} Standard : un catcheur standard ne doit pas avoir d'effet réel.`);
    if(card.type==="Catcheur"&&(card.rarity==="Standard"||card.rarity==="Rare")){
      const total=STATS.reduce((sum,stat)=>sum+Number(card.stats?.[stat]||0),0);
      if(total!==24)errors.push(`${card.name} ${card.rarity} : ${total} points de stats au lieu de 24.`);
    }
    if(card.renderArt&&!String(card.renderArt).trim())warnings.push(`${card.name} ${card.rarity} : renderArt vide.`);
    const text=String(card.effect||"").toLowerCase();
    const impliesChoice=/\b(choisissez|choisis)\b/.test(text)||(/\bou\b/.test(text)&&!/\bou plus\b/.test(text)&&!/\bsi vous jouez\b/.test(text));
    if(card.ability&&impliesChoice&&!EFFECT_REGISTRY[card.ability]?.choice){
      warnings.push(`${card.name} ${card.rarity} : le texte implique un choix, mais l'effet "${card.ability}" n'est pas déclaré comme choix.`);
    }
    if(card.ability&&/permanent/.test(text)&&!String(card.ability).toLowerCase().includes("permanent")){
      warnings.push(`${card.name} ${card.rarity} : le texte parle de permanent, vérification manuelle recommandée.`);
    }
  });
  const standardsWithEffectText=CARD_DATA.filter(card=>card.type==="Catcheur"&&card.rarity==="Standard"&&card.effect&&card.effect!=="Aucun effet.");
  if(standardsWithEffectText.length)warnings.push(`Catcheurs standards avec texte d'effet non vide : ${standardsWithEffectText.map(card=>card.name).join(", ")}.`);
  const result={ok:errors.length===0,errors,warnings,info,cardCount:CARD_DATA.length,effectCount:Object.keys(EFFECT_REGISTRY).length};
  window.ALLSTAR_AUDIT=result;
  const level=result.ok?"log":"warn";
  console[level](`[AUDIT ALLSTAR] ${result.ok?"OK":"À vérifier"} - ${errors.length} erreur(s), ${warnings.length} avertissement(s), ${CARD_DATA.length} carte(s).`);
  errors.forEach(message=>console.error(`[AUDIT][ERREUR] ${message}`));
  warnings.forEach(message=>console.warn(`[AUDIT][WARN] ${message}`));
  return result;
}
function makeDeck(keys){
  const wanted=normalizeDeckCards(keys);
  return wanted.map(key=>cloneCard(cardByKey(key))).filter(Boolean).map(c=>({...c,id:Math.random().toString(36).slice(2)}));
}
function makeAiDeckKeys(){
  const catcheurs=CARD_DATA.filter(card=>card.type==="Catcheur"&&card.rarity==="Standard").map(cardKey);
  const supports=CARD_DATA.filter(card=>card.type!=="Catcheur"&&card.rarity==="Standard").map(cardKey);
  const rares=CARD_DATA.filter(card=>card.type==="Catcheur"&&card.rarity==="Rare").map(cardKey);
  const base=legalDeckKeys([...shuffle([...catcheurs]),...shuffle([...supports]),...shuffle([...rares])]);
  if(base.some(key=>cardByKey(key)?.type==="Catcheur"))return base;
  return legalDeckKeys([CARD_DATA.find(card=>card.type==="Catcheur"),...base].map(card=>typeof card==="string"?card:cardKey(card)));
}
function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
let screenTransitionTimer=null;
function setActiveScreen(id){
  document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));
  const screen=document.getElementById(id);
  if(screen)screen.classList.add("active");
}
function show(id){
  const current=document.querySelector(".screen.active");
  const screen=document.getElementById(id);
  if(!screen)return;
  if(current===screen)return;
  const curtain=document.getElementById("screenTransition");
  if(!curtain){
    setActiveScreen(id);
    return;
  }
  clearTimeout(screenTransitionTimer);
  curtain.classList.add("active","to-black");
  curtain.classList.remove("from-black");
  screenTransitionTimer=setTimeout(()=>{
    setActiveScreen(id);
    curtain.classList.remove("to-black");
    curtain.classList.add("from-black");
    screenTransitionTimer=setTimeout(()=>{
      curtain.classList.remove("active","from-black");
    },240);
  },120);
}
function sound(){return window.audioManager || null}
function playSound(id){sound()?.playSfx(id)}
function isWrestlerMusic(id){return Boolean(window.AUDIO_LIBRARY?.music?.[id]?.wrestler)}
function playMusic(id){isWrestlerMusic(id) ? sound()?.playMusic(id) : sound()?.playWrestlerRadio?.()}
function fadeMusic(id,duration=800){if(isWrestlerMusic(id))sound()?.fadeMusic(id,duration)}
function showMenu(){
  hideOptions();
  if(G?.mode==="online"&&G?.over)window.closeOnlineSession?.();
  show("menu");
  playMusic("menu");
}
function showCareer(){show("career");renderCareer()}
function showDecks(){
  show("decks");
  document.getElementById("deckHub")?.classList.add("active");
  document.getElementById("deckEditorShell")?.classList.remove("active");
  closeDeckModal();
  setDeckStatus("");
}
function showDeckEditor(){
  show("decks");
  document.getElementById("deckHub")?.classList.remove("active");
  document.getElementById("deckEditorShell")?.classList.add("active");
  renderDeckManager();
}
function showAllstarChallenge(){show("challenge");renderAllstarChallenge()}
function showShop(){show("shop");renderShop()}
function showCollection(){show("collection");renderCollection()}
function showMulti(){
  show("multi");
  try{
    window.initMultiplayerStatus?.();
  }catch(error){
    console.error("[MULTI] Initialisation impossible", error);
    window.displayMultiplayerError?.(error, "Multijoueur indisponible.");
  }
}
function showHomeOptions(){show("homeOptionsScreen")}
function showProfile(){show("profileScreen");renderProfileScreen()}
function toggleOptions(){document.getElementById("optionsMenu").classList.toggle("active")}
function hideOptions(){document.getElementById("optionsMenu")?.classList.remove("active")}

const DISPLAY_SETTINGS_KEY="allstarsDisplaySettings";
function readDisplaySettings(){
  try{
    return {...{fullscreen:true,resolution:"1600x900"},...JSON.parse(localStorage.getItem(DISPLAY_SETTINGS_KEY)||"{}")};
  }catch{
    return {fullscreen:true,resolution:"1600x900"};
  }
}
function writeDisplaySettings(settings){
  try{localStorage.setItem(DISPLAY_SETTINGS_KEY,JSON.stringify(settings))}catch{}
}
function selectedResolutionSize(value){
  const match=String(value||"1600x900").match(/^(\d+)x(\d+)$/);
  return match ? {width:Number(match[1]),height:Number(match[2])} : {width:1600,height:900};
}
async function applyDisplaySettings(settings=readDisplaySettings()){
  writeDisplaySettings(settings);
  document.querySelectorAll(".fullscreen-control").forEach(input=>{input.checked=Boolean(settings.fullscreen)});
  document.querySelectorAll(".resolution-control").forEach(select=>{
    select.value=settings.resolution||"1600x900";
    select.disabled=Boolean(settings.fullscreen&&window.AllstarDesktop?.isElectron);
  });
  if(!window.AllstarDesktop)return;
  if(settings.fullscreen){
    await window.AllstarDesktop.setFullscreen?.(true);
  }else{
    const size=selectedResolutionSize(settings.resolution);
    await window.AllstarDesktop.setResolution?.(size.width,size.height);
  }
}
function wireDisplayOptions(){
  const settings=readDisplaySettings();
  document.querySelectorAll(".fullscreen-control").forEach(input=>{
    input.checked=Boolean(settings.fullscreen);
    input.addEventListener("change",()=>{
      const next={...readDisplaySettings(),fullscreen:input.checked};
      applyDisplaySettings(next);
    });
  });
  document.querySelectorAll(".resolution-control").forEach(select=>{
    select.value=settings.resolution||"1600x900";
    select.addEventListener("change",()=>{
      const next={...readDisplaySettings(),resolution:select.value,fullscreen:false};
      applyDisplaySettings(next);
    });
  });
  applyDisplaySettings(settings);
}
async function showInstalledVersion(){
  const target=document.getElementById("appVersion");
  if(!target)return;
  try{
    const version=await window.AllstarDesktop?.getAppVersion?.();
    target.textContent=version ? `Version ${version}` : "Version navigateur";
  }catch{
    target.textContent="Version inconnue";
  }
}
function openSessionModal(title="Pause", body="Que veux-tu faire ?"){
  const modal=document.getElementById("sessionModal");
  const titleEl=document.getElementById("sessionModalTitle");
  const bodyEl=document.getElementById("sessionModalBody");
  if(titleEl)titleEl.textContent=title;
  if(bodyEl)bodyEl.textContent=body;
  modal?.classList.add("active");
}
function closeSessionModal(){document.getElementById("sessionModal")?.classList.remove("active")}
function requestProfileLogout(){openSessionModal("Deconnexion","Se deconnecter du compte ALLSTAR et revenir a l'ecran de connexion ?")}
function requestQuitGame(){openSessionModal("Quitter le jeu","Fermer ALLSTAR maintenant ?")}
async function confirmProfileLogout(){
  closeSessionModal();
  await logoutProfileAccount();
  show("saveScreen");
  renderSaveScreen();
}
async function confirmQuitGame(){
  try{await pushCloudSaveNow()}catch{}
  if(window.AllstarDesktop?.quitApp){
    window.AllstarDesktop.quitApp();
    return;
  }
  closeSessionModal();
  showMenu();
}
function handleEscapeKey(event){
  if(event.key!=="Escape")return;
  if(document.getElementById("sessionModal")?.classList.contains("active")){
    closeSessionModal();
    return;
  }
  if(document.getElementById("optionsMenu")?.classList.contains("active")){
    hideOptions();
    return;
  }
  openSessionModal();
}

const profileUiState={user:null,profile:null,loading:false,message:""};
function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g, char=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    "\"":"&quot;",
    "'":"&#39;"
  }[char]));
}
function profileErrorMessage(error){
  const code=String(error?.code || error?.message || "");
  if(code.includes("auth/email-already-in-use"))return "Cette adresse est déjà utilisée.";
  if(code.includes("auth/invalid-email"))return "Adresse e-mail invalide.";
  if(code.includes("auth/weak-password"))return "Mot de passe trop court.";
  if(code.includes("auth/missing-password"))return "Entre ton mot de passe.";
  if(code.includes("auth/user-not-found"))return "Aucun compte trouvé avec cette adresse.";
  if(code.includes("auth/operation-not-allowed"))return "Active le fournisseur E-mail / Mot de passe dans Firebase Authentication.";
  if(code.includes("auth/invalid-credential") || code.includes("auth/wrong-password"))return "Identifiants incorrects.";
  if(code.includes("auth/network-request-failed"))return "Connexion Firebase indisponible.";
  if(code.includes("permission-denied"))return "Compte connecté, mais le profil cloud est bloqué par les règles Firestore.";
  if(code.includes("Firebase non configuré") || code.includes("Firebase non configure"))return "Firebase n'est pas configuré.";
  return code ? `Action impossible : ${code}` : "Action impossible pour le moment.";
}
function firebaseModeLabel(){
  const status=window.AllstarFirebaseService?.firebaseStatus?.();
  if(!status?.configured)return "Firebase non configuré";
  return status.status==="ready" ? "Firebase connecté" : "Firebase prêt, connexion à la demande";
}
async function renderProfileScreen(message=""){
  const root=document.getElementById("profileContent");
  if(!root)return;
  profileUiState.message=message;
  root.innerHTML=`
    <div class="profile-stats-shell">
      <div class="profile-xp-card">
        <div class="profile-level-row"><span>Profil</span><strong>Chargement...</strong></div>
      </div>
    </div>
  `;
  if(!window.AllstarAuthService || !window.AllstarFirebaseService?.firebaseStatus?.().configured){
    renderProfileContent("Profil local");
    return;
  }
  if(profileUiState.loading)return;
  profileUiState.loading=true;
  try{
    const user=await window.AllstarAuthService.getCurrentUser();
    profileUiState.user=user;
    try{
      profileUiState.profile=user ? await window.AllstarProfileService.ensureUserProfile(user) : null;
    }catch(error){
      profileUiState.profile=null;
      renderProfileContent(profileErrorMessage(error), true);
      return;
    }
    renderProfileContent(message);
  }catch(error){
    renderProfileContent(profileErrorMessage(error), true);
  }finally{
    profileUiState.loading=false;
  }
}
function localProfileProgress(){
  loadPlayerState();
  playerState.profileProgress=window.AllstarRankingService.normalizeProgress(playerState.profileProgress||{});
  return playerState.profileProgress;
}
function countUniqueOwnedCards(){
  loadPlayerState();
  return Object.values(playerState.collection||{}).filter(count=>Number(count)>0).length;
}
function profileProgressView(profile){
  const progress=window.AllstarRankingService.normalizeProgress(profile||{});
  const rank=window.AllstarRankingService.rankForElo(progress.elo,progress.rankedMatches);
  const nextXp=window.AllstarRankingService.xpForNextLevel(progress.level);
  const xpPct=Math.max(0,Math.min(100,(progress.xp/nextXp)*100));
  const protection="★".repeat(progress.rankProtection)+"☆".repeat(Math.max(0,3-progress.rankProtection));
  return {progress,rank,nextXp,xpPct,protection};
}
function renderProfileStats(profile, connected){
  const {progress,rank,nextXp,xpPct,protection}=profileProgressView(profile);
  const uniqueOwned=countUniqueOwnedCards();
  const tryoutText=rank.id==="tryouts" ? `${progress.rankedMatches}/${window.AllstarRankingService.TRYOUT_MATCHES} matchs` : `${progress.elo} ELO`;
  const totalMatches=Number(progress.wins||0)+Number(progress.losses||0);
  return `
    <div class="profile-xp-card">
      <div class="profile-level-row">
        <span>Niveau ${escapeHtml(progress.level)}</span>
        <strong>${escapeHtml(progress.xp)} / ${escapeHtml(nextXp)} XP</strong>
      </div>
      <div class="profile-xp-track"><div class="profile-xp-fill" style="width:${xpPct.toFixed(1)}%"></div></div>
      <div class="profile-small-note">${escapeHtml(progress.totalXp)} XP total</div>
    </div>
    <div class="profile-summary profile-summary-wide">
      <div class="profile-stat"><span class="profile-stat-label">Titre</span><strong>${escapeHtml(progress.title || "Rookie")}</strong><em>Titre actif</em></div>
      <div class="profile-stat"><span class="profile-stat-label">Classement</span><strong>${escapeHtml(rank.label)}</strong><em>${escapeHtml(tryoutText)}</em></div>
      <div class="profile-stat"><span class="profile-stat-label">Protection</span><strong>${escapeHtml(protection)}</strong><em>Relégation</em></div>
      <div class="profile-stat"><span class="profile-stat-label">Hall of Fame</span><strong>${progress.hallOfFame?"Oui":"Non"}</strong><em>Carrière</em></div>
      <div class="profile-stat"><span class="profile-stat-label">Collection</span><strong>${escapeHtml(uniqueOwned)}</strong><em>/ ${escapeHtml(CARD_DATA.length)} cartes</em></div>
      <div class="profile-stat"><span class="profile-stat-label">Victoires</span><strong>${escapeHtml(progress.wins)}</strong><em>${escapeHtml(window.AllstarRankingService.winrate(progress.wins,progress.losses))}</em></div>
      <div class="profile-stat"><span class="profile-stat-label">Défaites</span><strong>${escapeHtml(progress.losses)}</strong><em>Série ${escapeHtml(progress.currentStreak)}</em></div>
      <div class="profile-stat"><span class="profile-stat-label">Matchs</span><strong>${escapeHtml(totalMatches)}</strong><em>${escapeHtml(progress.rankedMatches)} classés</em></div>
    </div>
  `;
}
function renderProfileContent(message="", isError=false){
  const root=document.getElementById("profileContent");
  if(!root)return;
  const profile=profileUiState.profile || localProfileProgress();
  const user=profileUiState.user;
  const pseudo=escapeHtml(profile.pseudo || user?.displayName || "Invité");
  const email=escapeHtml(profile.email || user?.email || "");
  const uid=escapeHtml(user?.uid ? `${user.uid.slice(0,8)}...` : "local");
  const statusClass=isError ? "profile-status profile-error" : "profile-status";
  const progress=window.AllstarRankingService.normalizeProgress(profile);
  const stats=renderProfileStats(progress, Boolean(user));
  if(user){
    root.innerHTML=`
      <div class="profile-stats-shell">
        ${stats}
      </div>
    `;
    return;
  }
  root.innerHTML=`
    <div class="profile-stats-shell">
      ${stats}
      <div class="profile-actions profile-login-inline">
        <button class="profile-action gold" type="button" onclick="show('saveScreen');renderSaveScreen()">Connexion</button>
      </div>
    </div>
  `;
}
function setAccountView(viewId){
  ["accountChoiceView","accountLoginView","accountCreateView"].forEach(id=>{
    document.getElementById(id)?.classList.toggle("active",id===viewId);
  });
  setSaveStatus("");
}
function showAccountChoice(){
  setAccountView("accountChoiceView");
}
function showAccountLogin(){
  setAccountView("accountLoginView");
}
function showAccountCreate(){
  setAccountView("accountCreateView");
}
function profileCredentials(mode="login"){
  if(mode==="create"){
    return {
      pseudo:document.getElementById("createPseudo")?.value || "",
      email:document.getElementById("createEmail")?.value || "",
      password:document.getElementById("createPassword")?.value || ""
    };
  }
  return {
    pseudo:"",
    email:document.getElementById("loginEmail")?.value || "",
    password:document.getElementById("loginPassword")?.value || ""
  };
}
function profileResultMessage(action,result){
  if(result?.profileError)return `${action}. ${profileErrorMessage(result.profileError)}`;
  return action;
}
let cloudSaveSyncTimer=null;
let cloudSaveHydrating=false;
function serializedPlayerState(){
  return {
    credits:playerState.credits,
    collection:playerState.collection||{},
    boosterTickets:playerState.boosterTickets||{},
    challenge:playerState.challenge||null,
    starterGranted:Boolean(playerState.starterGranted),
    welcomeClaimed:Boolean(playerState.welcomeClaimed),
    careerUnlocked:playerState.careerUnlocked||0,
    settledOnlineMatches:playerState.settledOnlineMatches||{},
    savedAt:Number(playerState.savedAt)||0,
    profileProgress:playerState.profileProgress||{}
  };
}
function serializedDeckState(){
  return {
    decks:deckState.decks||[],
    selectedId:deckState.selectedId||null
  };
}
async function pushCloudSaveNow(){
  if(cloudSaveHydrating || !window.AllstarAuthService || !window.AllstarSaveService)return;
  const user=await window.AllstarAuthService.getCurrentUser();
  if(!user)return;
  loadPlayerState();
  loadDeckState();
  await window.AllstarSaveService.savePlayerData(user.uid,{
    playerState:serializedPlayerState(),
    deckState:serializedDeckState(),
    collection:playerState.collection||{},
    decks:serializedDeckState()
  });
}
function queueCloudSave(){
  if(cloudSaveHydrating || !window.AllstarAuthService || !window.AllstarSaveService)return;
  clearTimeout(cloudSaveSyncTimer);
  cloudSaveSyncTimer=setTimeout(()=>pushCloudSaveNow().catch(()=>{}),500);
}
function remotePlayerState(remote){
  if(remote?.playerState)return remote.playerState;
  if(remote?.collection || remote?.credits || remote?.profileProgress){
    return {
      credits:Number(remote.credits)||0,
      collection:remote.collection||{},
      boosterTickets:remote.boosterTickets||{},
      challenge:remote.challenge||null,
      starterGranted:Boolean(remote.starterGranted),
      welcomeClaimed:Boolean(remote.welcomeClaimed),
      careerUnlocked:Number(remote.careerUnlocked)||0,
      settledOnlineMatches:remote.settledOnlineMatches||{},
      savedAt:Number(remote.savedAt)||0,
      profileProgress:remote.profileProgress||{}
    };
  }
  return null;
}
function remoteDeckState(remote){
  if(remote?.deckState?.decks?.length)return remote.deckState;
  if(remote?.decks?.decks?.length)return remote.decks;
  return null;
}

function mergeSavedCounts(remoteCounts={},localCounts={}){
  const merged={...remoteCounts};
  Object.entries(localCounts||{}).forEach(([key,value])=>{
    merged[key]=Math.max(Number(merged[key])||0,Number(value)||0);
  });
  return merged;
}

function mergePlayerStateForHydration(remotePlayer,localPlayer){
  if(!remotePlayer)return localPlayer||null;
  if(!localPlayer)return remotePlayer;
  const localIsNewer=Number(localPlayer.savedAt||0)>Number(remotePlayer.savedAt||0);
  return {
    ...remotePlayer,
    credits:localIsNewer ? Number(localPlayer.credits)||0 : Number(remotePlayer.credits)||0,
    collection:mergeSavedCounts(remotePlayer.collection,localPlayer.collection),
    boosterTickets:mergeSavedCounts(remotePlayer.boosterTickets,localPlayer.boosterTickets),
    challenge:localIsNewer ? (localPlayer.challenge||null) : (remotePlayer.challenge||null),
    starterGranted:Boolean(remotePlayer.starterGranted||localPlayer.starterGranted),
    welcomeClaimed:Boolean(remotePlayer.welcomeClaimed||localPlayer.welcomeClaimed),
    careerUnlocked:Math.max(Number(remotePlayer.careerUnlocked)||0,Number(localPlayer.careerUnlocked)||0),
    settledOnlineMatches:{...(remotePlayer.settledOnlineMatches||{}),...(localPlayer.settledOnlineMatches||{})},
    savedAt:Math.max(Number(remotePlayer.savedAt)||0,Number(localPlayer.savedAt)||0),
    profileProgress:localIsNewer ? (localPlayer.profileProgress||{}) : (remotePlayer.profileProgress||{})
  };
}

async function hydrateCloudSaveForUser(user){
  if(!user || !window.AllstarSaveService)return false;
  const remote=await window.AllstarSaveService.loadPlayerData(user.uid);
  const remotePlayer=remotePlayerState(remote);
  const nextDecks=remoteDeckState(remote);
  let localPlayer=null;
  try{
    localPlayer=JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY)||"null");
  }catch{}
  const nextPlayer=mergePlayerStateForHydration(remotePlayer,localPlayer);
  if(!nextPlayer && !nextDecks)return false;
  const needsCloudSync=Boolean(remotePlayer&&JSON.stringify(nextPlayer)!==JSON.stringify(remotePlayer));
  cloudSaveHydrating=true;
  try{
    if(nextPlayer)localStorage.setItem(PLAYER_STORAGE_KEY,JSON.stringify(nextPlayer));
    if(nextDecks)localStorage.setItem(DECK_STORAGE_KEY,JSON.stringify(nextDecks));
    resetRuntimeProgress();
  }finally{
    cloudSaveHydrating=false;
  }
  if(needsCloudSync)queueCloudSave();
  return true;
}
async function createProfileAccount(){
  return createAccountFromStart();
}
async function loginProfileAccount(){
  return loginAccountFromStart();
}
async function createAccountFromStart(){
  const {email,password,pseudo}=profileCredentials("create");
  setSaveStatus("Création du compte...");
  try{
    const result=await window.AllstarAuthService.registerUser(email,password,pseudo);
    profileUiState.user=result.user;
    profileUiState.profile=result.profile;
    setSaveStatus(profileResultMessage("Compte créé", result));
    resetRuntimeProgress();
    enterSavedGame();
    queueCloudSave();
  }catch(error){
    setSaveStatus(profileErrorMessage(error));
  }
}
async function loginAccountFromStart(){
  const {email,password}=profileCredentials("login");
  setSaveStatus("Connexion...");
  try{
    const result=await window.AllstarAuthService.loginUser(email,password);
    profileUiState.user=result.user;
    profileUiState.profile=result.profile;
    setSaveStatus("Connexion reussie. Chargement du profil cloud...");
    const cloudLoaded=await hydrateCloudSaveForUser(result.user);
    setSaveStatus(profileResultMessage(cloudLoaded ? "Sauvegarde cloud chargee" : "Connecté", result));
    resetRuntimeProgress();
    enterSavedGame();
    if(!cloudLoaded)queueCloudSave();
  }catch(error){
    setSaveStatus(profileErrorMessage(error));
  }
}
async function sendPasswordResetFromStart(){
  const email=(document.getElementById("loginEmail")?.value || document.getElementById("createEmail")?.value || "");
  if(!email.trim()){
    setSaveStatus("Entre ton adresse e-mail pour réinitialiser le mot de passe.");
    return;
  }
  setSaveStatus("Envoi du lien de réinitialisation...");
  try{
    await window.AllstarAuthService.resetPassword(email);
    setSaveStatus("E-mail de réinitialisation envoyé.");
  }catch(error){
    setSaveStatus(profileErrorMessage(error));
  }
}
function startGuestMode(){
  setSaveStatus("Mode invité...");
  if(hasSaveGame()){
    resetRuntimeProgress();
    enterSavedGame();
    return;
  }
  startNewSave();
}
async function logoutProfileAccount(){
  try{
    await pushCloudSaveNow();
    await window.AllstarAuthService.logoutUser();
  }catch(error){
    renderProfileContent(profileErrorMessage(error), true);
    return;
  }
  profileUiState.user=null;
  profileUiState.profile=null;
  renderProfileContent("Déconnecté.");
}

function init(label,side,deckKeys){
  return {
    label,
    side,
    deck:shuffle(makeDeck(deckKeys)),
    hand:[],
    grave:[],
    cat:null,
    man:null,
    obj:null,
    objEffect:null,
    wins:0,
    koSuffered:0,
    nextEntryMods:null,
    oncePerMatch:{},
    tagsRemaining:TAGS_PER_MATCH,
    tagLockedCardId:null,
    played:{Catcheur:false,Manager:false,Objet:false}
  };
}

function draw(p,n=1){
  for(let i=0;i<n;i++){
    if(!p.deck.length&&p.grave.length){
      p.deck=shuffle(p.grave.splice(0));
      log(`${p.label} remélange son vestiaire dans son deck.`);
    }
    if(p.deck.length)p.hand.push(p.deck.pop());
  }
}

function hasCat(hand){return hand.some(c=>c.type==="Catcheur")}

function drawStartOfRound(){
  [G.player,G.ai].forEach(p=>{
    const before=p.hand.length;
    const bonus=Number(p.nextDrawBonus||0);
    p.nextDrawBonus=0;
    draw(p,1+bonus);
    if(p.hand.length>before){
      playSound("pioche");
      log(`${p.label} pioche ${p.hand.length-before} carte${p.hand.length-before>1?"s":""}.`);
    }else{
      playSound("erreur");
      log(`${p.label} ne peut pas piocher.`);
    }
  });
}

function rpsWinner(player,ai){
  if(player===ai)return "tie";
  const playerWins =
    (player==="Pierre"&&ai==="Ciseaux")||
    (player==="Feuille"&&ai==="Pierre")||
    (player==="Ciseaux"&&ai==="Feuille");
  return playerWins ? "player" : "ai";
}

function showRpsOverlay(){
  document.getElementById("rpsOverlay").classList.add("active");
  document.getElementById("rpsButtons").style.display="flex";
  document.getElementById("rpsInstruction").textContent="Choisis ton ouverture !";
  document.getElementById("rpsResult").innerHTML="";
}

function hideRpsOverlay(){
  document.getElementById("rpsOverlay").classList.remove("active");
}

function requestEffectChoice({title,text,choices,onChoose}){
  const overlay=document.getElementById("effectChoiceOverlay");
  const titleEl=document.getElementById("effectChoiceTitle");
  const textEl=document.getElementById("effectChoiceText");
  const choicesEl=document.getElementById("effectChoiceButtons");
  if(!overlay||!titleEl||!textEl||!choicesEl){
    const fallback=choices?.[0]?.value;
    if(onChoose)onChoose(fallback);
    return;
  }
  titleEl.textContent=title||"Choix d'effet";
  textEl.textContent=text||"Choisis l'effet à appliquer.";
  choicesEl.innerHTML=(choices||[]).map((choice,index)=>`<button class="small-btn effect-choice-btn" type="button" data-choice-index="${index}">${choice.label}</button>`).join("");
  choicesEl.querySelectorAll("button").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const choice=choices[Number(btn.dataset.choiceIndex)]||choices[0];
      overlay.classList.remove("active");
      choicesEl.innerHTML="";
      if(onChoose)onChoose(choice?.value);
    },{once:true});
  });
  overlay.classList.add("active");
}

function chooseRps(playerChoice){
  playSound("pfc");
  const choices=["Pierre","Feuille","Ciseaux"];
  const aiChoice=choices[Math.floor(Math.random()*3)];
  const result=rpsWinner(playerChoice,aiChoice);
  const resultBox=document.getElementById("rpsResult");

  log(`PFC : Joueur ${playerChoice} / Adversaire ${aiChoice}.`);

  if(result==="tie"){
    resultBox.innerHTML=`<div class="rps-outcome tie">\u00c9GALIT\u00c9 !</div>`;
    log("PFC : égalité, on recommence.");
    return;
  }

  G.firstStarter=result;
  G.nextStarter=result;
  resultBox.innerHTML=result==="player"
    ? `<div class="rps-outcome win">GAGN\u00c9 !</div>`
    : `<div class="rps-outcome lose">PERDU !</div>`;
  log(result==="player" ? "Le Joueur commence le match." : "L'Adversaire commence le match.");

  document.getElementById("rpsButtons").style.display="none";

  setTimeout(()=>{
    hideRpsOverlay();
    startRound();
    log("<b>La cloche sonne !</b>");
  },900);
}
function startGame(){
  return showDeckSelect({
    mode:"match",
    returnScreen:"menu",
    options:{}
  });
}

function showSystemToast(message,duration=2400){
  const toast=document.getElementById("systemToast");
  if(!toast)return;
  toast.textContent=message;
  toast.classList.add("active");
  clearTimeout(showSystemToast.timer);
  showSystemToast.timer=setTimeout(()=>toast.classList.remove("active"),duration);
}

function blockMatchLaunch(message){
  setDeckStatus(message);
  const careerStatus=document.getElementById("careerStatus");
  if(document.getElementById("career")?.classList.contains("active")&&careerStatus){
    careerStatus.textContent=message;
  }
  showSystemToast(message);
}

let deckSelectContext=null;

function showDeckSelect(context={}){
  loadDeckState();
  const decks=deckState.decks.length?deckState.decks:[defaultDeck()];
  if(!deckState.selectedId&&decks[0])deckState.selectedId=decks[0].id;
  deckSelectContext={
    mode:context.mode||"match",
    returnScreen:context.returnScreen||"menu",
    options:context.options||{},
    onReady:context.onReady||null
  };
  renderDeckSelect();
  show("deckSelect");
}

function deckLaunchMessage(deck){
  if(!deck)return "Aucun deck sélectionné.";
  const normalized={...deck,cards:normalizeOwnedDeckCards(deck.cards)};
  if(normalized.cards.length!==20)return `Ce deck doit contenir exactement 20 cartes (${normalized.cards.length}/20).`;
  const ruleMessage=deckRuleMessage(normalized);
  if(ruleMessage)return ruleMessage;
  if(!normalized.cards.some(key=>cardByKey(key)?.type==="Catcheur"))return "Ajoute au moins un catcheur au deck.";
  return "";
}

function renderDeckSelect(){
  const list=document.getElementById("deckSelectList");
  const status=document.getElementById("deckSelectStatus");
  if(!list||!status)return;
  const decks=deckState.decks.length?deckState.decks:[defaultDeck()];
  list.innerHTML=decks.map(deck=>{
    const active=deck.id===deckState.selectedId;
    const message=deckLaunchMessage(deck);
    const rareCount=deckRarityCount(deck,"Rare");
    const legendCount=deckRarityCount(deck,"Legende");
    return `<button class="deck-select-row ${active?"active":""}" onclick="selectLaunchDeck('${escapeAttr(deck.id)}')">
      <span>${deck.name}</span>
      <b>${deck.cards.length}/20 cartes</b>
      <small>Rares ${rareCount}/8 · Légendaires ${legendCount}/3${message?` · ${message}`:""}</small>
    </button>`;
  }).join("");
  const selected=selectedDeck();
  status.textContent=deckLaunchMessage(selected);
}

function selectLaunchDeck(id){
  deckState.selectedId=id;
  saveDeckState();
  renderDeckSelect();
}

function confirmDeckReady(){
  const deck=selectedDeck();
  const message=deckLaunchMessage(deck);
  if(message){
    const status=document.getElementById("deckSelectStatus");
    if(status)status.textContent=message;
    showSystemToast(message);
    return;
  }
  const launchDeck={...deck,cards:normalizeOwnedDeckCards(deck.cards)};
  if(deckSelectContext?.onReady){
    deckSelectContext.onReady(launchDeck);
    return;
  }
  startMatch({
    ...(deckSelectContext?.options||{}),
    playerDeckKeys:launchDeck.cards
  });
}

function cancelDeckSelect(){
  const target=deckSelectContext?.returnScreen||"menu";
  deckSelectContext=null;
  if(target==="career")return showCareer();
  if(target==="multi")return showMulti();
  if(target==="challenge")return showAllstarChallenge();
  return showMenu();
}

function startMatch(options={}){
  loadDeckState();
  const activeDeck = options.playerDeckKeys
    ? {name:"Deck sélectionné",cards:normalizeOwnedDeckCards(options.playerDeckKeys)}
    : (selectedDeck() || defaultDeck());
  activeDeck.cards = normalizeOwnedDeckCards(activeDeck.cards);
  if (activeDeck.cards.length !== 20) {
    blockMatchLaunch(`Ton deck doit contenir exactement 20 cartes pour lancer une partie (${activeDeck.cards.length}/20).`);
    return;
  }
  const ruleMessage = deckRuleMessage(activeDeck);
  if (ruleMessage) {
    blockMatchLaunch(ruleMessage);
    return;
  }
  if (!activeDeck.cards.some(key => cardByKey(key)?.type === "Catcheur")) {
    blockMatchLaunch("Ajoute au moins un catcheur avant de lancer une partie.");
    return;
  }
  if(options.mode==="challenge"){
    const challengeState=ensureAllstarChallengeState();
    if(challengeState.completed){
      showSystemToast("Défi déjà remporté cette semaine.");
      showAllstarChallenge();
      return;
    }
    if(challengeState.lives<=0){
      showSystemToast("Vies épuisées : reviens dans 24h.");
      showAllstarChallenge();
      return;
    }
    const boss=cardByKey(challengeState.bossKey)||weeklyChallengeBoss().boss;
    options={
      ...options,
      aiLabel:boss?.name||options.aiLabel||"Boss ALLSTAR",
      aiDeckKeys:challengeDeckForBoss(boss),
      challenge:challengeMatchPayload(challengeState)
    };
  }
  hideOptions();
  hidePin();
  hideRpsOverlay();
  fadeMusic("match",700);
  const aiDeckKeys=legalDeckKeys(options.aiDeckKeys||makeAiDeckKeys());

  G={
    round:0,
    over:false,
    stat:null,
    player:init("Joueur","player", activeDeck.cards),
    ai:init(options.aiLabel||"Adversaire","ai", aiDeckKeys),
    mode:options.mode||"duel",
    careerIndex:Number.isInteger(options.careerIndex)?options.careerIndex:null,
    matchOptions:{
      ...options,
      playerDeckKeys:[...activeDeck.cards],
      aiDeckKeys:[...aiDeckKeys]
    },
    challenge:options.challenge ? {...options.challenge} : null,
    discarding:null,
    currentTurn:null,
    firstStarter:null,
    nextStarter:null,
    turnsTaken:0,
    resolving:false,
    effectMarks:{}
  };

  setupChallengeBossOnRing();
  draw(G.player,5);
  draw(G.ai,5);

  // Mulligan uniquement au début de partie si aucun catcheur.
  while(!hasCat(G.player.hand)){
    G.player.deck.push(...G.player.hand.splice(0));
    shuffle(G.player.deck);
    draw(G.player,5);
  }
  while(!hasCat(G.ai.hand)){
    G.ai.deck.push(...G.ai.hand.splice(0));
    shuffle(G.ai.deck);
    draw(G.ai,5);
  }

  document.getElementById("log").innerHTML="";
  show("game");
  render();

  // Le PFC n'a lieu qu'une seule fois : au début du match.
  if(G.mode==="online"){
    G.firstStarter="player";
    G.nextStarter="player";
    log("Mode en ligne : Joueur 1 commence.");
    markOnlineDirty();
    startRound();
    return;
  }
  showRpsOverlay();
}

function startOnlineMatchFromRoom(room, playerSlot){
  if(!room || room.status!=="playing"){
    showSystemToast("Room en ligne pas encore prête.");
    return;
  }
  const ownSlot=playerSlot==="p2"?"p2":"p1";
  const opponentSlot=ownSlot==="p1"?"p2":"p1";
  const ownDeck=Array.isArray(room.players?.[ownSlot]?.deck)?room.players[ownSlot].deck:[];
  const opponentDeck=Array.isArray(room.players?.[opponentSlot]?.deck)?room.players[opponentSlot].deck:[];
  if(ownDeck.length!==20 || opponentDeck.length!==20){
    showSystemToast("Decks en ligne incomplets.");
    showMulti();
    return;
  }
  if(ownSlot==="p2" && !room.matchState){
    showMulti();
    setMultiStatus?.("En attente du lancement par le Joueur 1...");
    return;
  }
  if(room.matchState){
    enterOnlineMatchFromSnapshot(room, ownSlot);
    return;
  }
  startMatch({
    mode:"online",
    roomCode:room.roomCode,
    onlineMatchId:`${room.roomCode}-${Date.now().toString(36)}`,
    onlinePlayerSlot:ownSlot,
    ranked:Boolean(room.ranked),
    opponentElo:Number(room.players?.[opponentSlot]?.elo||1000),
    aiLabel:room.players?.[opponentSlot]?.name||"Adversaire en ligne",
    playerDeckKeys:ownDeck,
    aiDeckKeys:opponentDeck,
    onlineRoom:{
      roomCode:room.roomCode,
      playerSlot:ownSlot,
      opponentSlot
    }
  });
  publishOnlineSnapshotNow();
}

function onlineContext(){
  const options=G?.matchOptions?.onlineRoom;
  const fallback=typeof window.getOnlineMultiplayerContext==="function" ? window.getOnlineMultiplayerContext() : {};
  const playerSlot=options?.playerSlot || fallback?.playerSlot || "p1";
  return {
    roomCode:options?.roomCode || fallback?.room?.roomCode || G?.matchOptions?.roomCode || "",
    playerSlot,
    opponentSlot:options?.opponentSlot || (playerSlot==="p1" ? "p2" : "p1")
  };
}

function isOnlineMatch(){
  return G?.mode==="online";
}

function markOnlineDirty(){
  if(isOnlineMatch()&&!onlineApplyingRemote)onlineDirty=true;
}

function stripOwnerForNetwork(value){
  return JSON.parse(JSON.stringify(value,(key,val)=>key==="owner"?undefined:val));
}

function restoreOnlineSide(side, localSide){
  const restored=stripOwnerForNetwork(side||{});
  restored.side=localSide;
  restored.played=restored.played||{Catcheur:false,Manager:false,Objet:false};
  restored.oncePerMatch=restored.oncePerMatch||{};
  restored.tagsRemaining=Number.isFinite(restored.tagsRemaining)?restored.tagsRemaining:TAGS_PER_MATCH;
  restored.tagLockedCardId=restored.tagLockedCardId||null;
  restored.deck=Array.isArray(restored.deck)?restored.deck:[];
  restored.hand=Array.isArray(restored.hand)?restored.hand:[];
  restored.grave=Array.isArray(restored.grave)?restored.grave:[];
  if(restored.cat){
    restored.cat.owner=restored;
    restored.cat.permanentMods=normalizeMods(restored.cat.permanentMods);
    restored.cat.mods=normalizeMods(restored.cat.mods);
  }
  return restored;
}

function localSideToOnlineSlot(localSide){
  if(!localSide)return null;
  const ctx=onlineContext();
  return localSide==="player" ? ctx.playerSlot : ctx.opponentSlot;
}

function onlineSlotToLocalSide(slot){
  if(!slot)return null;
  const ctx=onlineContext();
  return slot===ctx.playerSlot ? "player" : "ai";
}

function onlineSnapshotFromGame(){
  if(!isOnlineMatch())return null;
  const ctx=onlineContext();
  const room=typeof window.getOnlineMultiplayerContext==="function" ? window.getOnlineMultiplayerContext()?.room : null;
  const p1Side=ctx.playerSlot==="p1" ? G.player : G.ai;
  const p2Side=ctx.playerSlot==="p1" ? G.ai : G.player;
  const winnerSlot=G.winner ? localSideToOnlineSlot(G.winner) : null;
  return {
    version:Date.now(),
    roomCode:ctx.roomCode,
    round:G.round,
    stat:G.stat,
    wheelSpinId:G.resolving&&G.stat ? `${G.round}:${G.stat}:${G.turnsTaken}` : null,
    matchId:G.matchOptions?.onlineMatchId||`${ctx.roomCode}:legacy`,
    lockedStat:G.lockedStat||null,
    over:Boolean(G.over),
    resolving:Boolean(G.resolving),
    turnsTaken:Number(G.turnsTaken||0),
    currentTurn:localSideToOnlineSlot(G.currentTurn),
    roundStarter:G.roundStarter ? localSideToOnlineSlot(G.roundStarter) : null,
    nextStarter:G.nextStarter ? localSideToOnlineSlot(G.nextStarter) : null,
    discarding:G.discarding ? localSideToOnlineSlot(G.discarding) : null,
    tagging:G.tagging ? localSideToOnlineSlot(G.tagging) : null,
    winner:winnerSlot,
    ranked:Boolean(G.matchOptions?.ranked),
    opponentElo:Number(G.matchOptions?.opponentElo||1000),
    rankedElos:{
      p1:Number(room?.players?.p1?.elo||0)||null,
      p2:Number(room?.players?.p2?.elo||0)||null
    },
    player:stripOwnerForNetwork(p1Side),
    ai:stripOwnerForNetwork(p2Side)
  };
}

function applyOnlineSnapshot(snapshot, playerSlot){
  if(!snapshot)return;
  const ownSlot=playerSlot==="p2" ? "p2" : "p1";
  const opponentSlot=ownSlot==="p1" ? "p2" : "p1";
  const p1=restoreOnlineSide(snapshot.player, ownSlot==="p1" ? "player" : "ai");
  const p2=restoreOnlineSide(snapshot.ai, ownSlot==="p2" ? "player" : "ai");
  const incomingWheelId=snapshot.wheelSpinId||null;
  const shouldShowRemoteWheel=Boolean(snapshot.resolving&&snapshot.stat&&incomingWheelId&&incomingWheelId!==onlineLastWheelSpinId);
  onlineApplyingRemote=true;
  G={
    ...(G||{}),
    round:Number(snapshot.round||0),
    over:Boolean(snapshot.over),
    stat:snapshot.stat||null,
    lockedStat:snapshot.lockedStat||null,
    player:ownSlot==="p1" ? p1 : p2,
    ai:ownSlot==="p1" ? p2 : p1,
    mode:"online",
    matchOptions:{
      ...(G?.matchOptions||{}),
      mode:"online",
      roomCode:snapshot.roomCode,
      onlineMatchId:snapshot.matchId||G?.matchOptions?.onlineMatchId||`${snapshot.roomCode||"room"}:legacy`,
      onlinePlayerSlot:ownSlot,
      ranked:Boolean(snapshot.ranked),
      opponentElo:Number(snapshot.rankedElos?.[opponentSlot]||snapshot.opponentElo||G?.matchOptions?.opponentElo||1000),
      onlineRoom:{
        roomCode:snapshot.roomCode,
        playerSlot:ownSlot,
        opponentSlot
      }
    },
    challenge:null,
    discarding:snapshot.discarding ? (snapshot.discarding===ownSlot ? "player" : "ai") : null,
    tagging:snapshot.tagging ? (snapshot.tagging===ownSlot ? "player" : "ai") : null,
    currentTurn:snapshot.currentTurn ? (snapshot.currentTurn===ownSlot ? "player" : "ai") : null,
    roundStarter:snapshot.roundStarter ? (snapshot.roundStarter===ownSlot ? "player" : "ai") : null,
    nextStarter:snapshot.nextStarter ? (snapshot.nextStarter===ownSlot ? "player" : "ai") : null,
    turnsTaken:Number(snapshot.turnsTaken||0),
    resolving:Boolean(snapshot.resolving),
    winner:snapshot.winner ? (snapshot.winner===ownSlot ? "player" : "ai") : null,
    effectMarks:G?.effectMarks||{}
  };
  show("game");
  render();
  if(shouldShowRemoteWheel){
    onlineLastWheelSpinId=incomingWheelId;
    showRemoteWheel(snapshot.stat);
  }
  if(G.over){
    settleOnlineMatchRewards();
    showOnlineFinalResult();
  }
  onlineApplyingRemote=false;
}

function enterOnlineMatchFromSnapshot(room, playerSlot){
  onlineLastAppliedVersion=Number(room?.matchState?.version||room?.matchState?.updatedAt||0);
  applyOnlineSnapshot(room?.matchState, playerSlot);
}

function applyOnlineRoomSnapshot(room, playerSlot){
  if(!room?.matchState)return;
  if(!isOnlineMatch() && (room.status==="playing"||room.status==="finished")){
    enterOnlineMatchFromSnapshot(room, playerSlot);
    return;
  }
  const version=Number(room.matchState.version||room.matchState.updatedAt||0);
  if(version && version<=onlineLastAppliedVersion)return;
  if(room.matchState.sourceSlot===playerSlot)return;
  onlineLastAppliedVersion=version||Date.now();
  applyOnlineSnapshot(room.matchState, playerSlot);
}

function queueOnlineSnapshotPublish(){
  if(!isOnlineMatch()||onlineApplyingRemote||!onlineDirty)return;
  if(typeof window.publishOnlineMatchState!=="function")return;
  clearTimeout(onlinePublishTimer);
  onlinePublishTimer=setTimeout(async()=>{
    if(!isOnlineMatch()||onlineApplyingRemote||!onlineDirty)return;
    const snapshot=onlineSnapshotFromGame();
    if(!snapshot)return;
    const hash=JSON.stringify(snapshot);
    if(hash===onlineLastSnapshotHash)return;
    onlineLastSnapshotHash=hash;
    onlineDirty=false;
    try{
      await window.publishOnlineMatchState(snapshot);
    }catch(error){
      console.error("[MULTI] Publication de l'état impossible",error);
      showSystemToast("Synchronisation en ligne interrompue.");
      onlineDirty=true;
    }
  },120);
}

function publishOnlineSnapshotNow(){
  if(!isOnlineMatch()||onlineApplyingRemote)return;
  if(typeof window.publishOnlineMatchState!=="function")return;
  const snapshot=onlineSnapshotFromGame();
  if(!snapshot)return;
  onlineLastSnapshotHash=JSON.stringify(snapshot);
  onlineDirty=false;
  window.publishOnlineMatchState(snapshot).catch(error=>{
    console.error("[MULTI] Publication initiale impossible",error);
    showSystemToast("Synchronisation en ligne interrompue.");
    onlineDirty=true;
  });
}

function startRound(){
  G.round++;
  G.stat=null;
  G.resolving=false;
  G.turnsTaken=0;

  [G.player,G.ai].forEach(p=>{
    p.played={Catcheur:false,Manager:false,Objet:false};
    p.objectsBlocked=false;
    p.managersBlocked=false;
  });

  applyRoundManagerEffects();
  reactivateExtendedObjects(false);
  drawStartOfRound();
  reactivateExtendedObjects(true);

  // Le PFC a choisi le starter du round 1.
  // Ensuite, l'initiative alterne à chaque round.
  G.currentTurn=G.nextStarter || "player";
  G.roundStarter=G.currentTurn;
  G.nextStarter=G.currentTurn==="player" ? "ai" : "player";

  markOnlineDirty();
  render();
  showRound();
  playSound("cloche");
  announceTurn();

  if(G.currentTurn==="ai"&&G.mode!=="online") setTimeout(aiTurnSequence,650);
}

function activePlayer(){return G.currentTurn==="player"?G.player:G.ai}
function inactivePlayer(){return G.currentTurn==="player"?G.ai:G.player}

function announceTurn(){
  log(G.currentTurn==="player" ? "<b>Tour du Joueur.</b>" : "<b>Tour de l'Adversaire.</b>");
}

function zeroMods(){return {Force:0,Vitesse:0,Technique:0,Charisme:0}}

function normalizeMods(mods){
  const out=zeroMods();
  STATS.forEach(stat=>out[stat]=Number(mods?.[stat]||0));
  return out;
}

function state(card){
  const permanentMods=normalizeMods(card?.permanentMods);
  return {
    card,
    mods:{...permanentMods},
    permanentMods,
    save:false,
    pin:0,
    managers:0,
    enteredRound:G?.round||0,
    forcePlusUsed:false,
    bossSecondWindUsed:false
  };
}

function addAllStats(s,value){
  STATS.forEach(stat=>s.mods[stat]+=value);
}

function addRandomStats(s,count,value=1){
  const pool=shuffle([...STATS]).slice(0,count);
  pool.forEach(stat=>s.mods[stat]+=value);
  return pool;
}

function replaceRoundRandomBonus(s,value){
  if(!s)return [];
  if(s.roundRandomBonus){
    Object.entries(s.roundRandomBonus).forEach(([stat,amount])=>s.mods[stat]-=amount);
  }
  const [stat]=shuffle([...STATS]).slice(0,1);
  s.mods[stat]+=value;
  s.roundRandomBonus={ [stat]: value };
  return [stat];
}

function cleanEffectMarks(){
  if(!G?.effectMarks)return;
  const now=Date.now();
  Object.keys(G.effectMarks).forEach(id=>{
    if(G.effectMarks[id].until<=now)delete G.effectMarks[id];
  });
}

function effectClassForKind(kind){
  return {
    buff:"effect-buff",
    malus:"effect-malus",
    block:"effect-block",
    pin:"effect-pin",
    special:"effect-special"
  }[kind]||"effect-special";
}

function showEffectFeedback(card,title,detail="",kind="special",duration=1800){
  if(!G||!card)return;
  G.effectMarks=G.effectMarks||{};
  G.effectMarks[card.id]={
    label:detail||title,
    className:effectClassForKind(kind),
    until:Date.now()+duration
  };

  const toast=document.getElementById("effectToast");
  if(toast){
    toast.innerHTML=`<div class="effect-toast-title">EFFET ACTIVÉ</div><strong>${title}</strong>${detail?`<span>${detail}</span>`:""}`;
    toast.className=`effect-toast active ${effectClassForKind(kind)}`;
    clearTimeout(showEffectFeedback.timer);
    showEffectFeedback.timer=setTimeout(()=>toast.classList.remove("active"),duration);
  }

  if(document.getElementById("game")?.classList.contains("active"))render();

  setTimeout(()=>{
    if(G?.effectMarks?.[card.id]?.until<=Date.now()){
      delete G.effectMarks[card.id];
      render();
    }
  },duration+40);
}

function effectOverlayHTML(c){
  cleanEffectMarks();
  const mark=G?.effectMarks?.[c?.id];
  if(!mark)return "";
  return `<div class="effect-card-ring ${mark.className}"></div><div class="effect-card-badge ${mark.className}">${mark.label}</div>`;
}

function isFirstRoundForWrestler(s){
  return Boolean(s&&G&&s.enteredRound===G.round);
}

function isMatchRoundOneForWrestler(s){
  return Boolean(s&&G&&G.round===1&&s.enteredRound===1);
}

function isMatchRoundOneAbility(ability){
  return [
    "firstRoundSpeedTechnique1",
    "firstRoundSpeedTechnique2",
    "firstRoundCharTech",
    "firstRoundCharTech2",
    "firstRoundForceCharTech",
    "firstRoundSpeedCharisma3",
    "techniqueRound1"
  ].includes(ability);
}

function isRoundEffectActive(s){
  if(!s)return false;
  const ability=wrestlerAbility(s);
  return isMatchRoundOneAbility(ability) ? isMatchRoundOneForWrestler(s) : isFirstRoundForWrestler(s);
}

function applyPendingEntryMods(owner,s){
  if(!owner.nextEntryMods)return;
  const parts=[];
  STATS.forEach(stat=>{
    const value=Number(owner.nextEntryMods?.[stat]||0);
    if(value){
      s.mods[stat]+=value;
      const signed=value>0?`+${value}`:`${value}`;
      parts.push(`${signed} ${stat}`);
    }
  });
  owner.nextEntryMods=null;
  if(parts.length){
    const kind=parts.some(part=>part.startsWith("-"))?"malus":"buff";
    log(`[EFFET] ${s.card.name} : ${parts.join(" / ")} à l'entrée.`);
    showEffectFeedback(s.card,s.card.name,parts.join(" / "),kind);
  }
}

function openingRoundEffectLabel(s){
  if(!s||!isRoundEffectActive(s))return "";
  const labels={
    firstRoundSpeed2:"+2 Vitesse",
    firstRoundSpeed3:"+3 Vitesse",
    firstRoundSpeedTechnique1:"+1 Vitesse / +1 Technique",
    firstRoundSpeedTechnique2:"+2 Vitesse / +2 Technique",
    firstRoundForceTechnique:"+1 Force / +1 Technique",
    firstRoundForceSpeed1:"+1 Force / +1 Vitesse",
    firstRoundForceSpeed2:"+2 Force / +2 Vitesse",
    firstRoundForceTechnique2:"+2 Force / +2 Technique",
    firstRoundCharTech:"+1 Charisme / +1 Technique",
    firstRoundCharTech2:"+2 Charisme / +2 Technique",
    firstRoundForceCharTech:"+1 Force / +1 Technique / +1 Charisme",
    firstRoundSpeedCharisma3:"+3 Vitesse / +3 Charisme",
    techniqueRound1:"+3 Technique",
    speedWheel25:"Roulette Vitesse 25%",
    speedWheel50:"Roulette Vitesse 50%",
    techniqueWheel75:"Roulette Technique 75%",
    wheelAutoReroll20:"Relance roulette 20%"
  };
  return labels[wrestlerAbility(s)]||"";
}

function turnOrderEffectLabel(s){
  const ability=wrestlerAbility(s);
  if(ability==="secondPlayerTechniqueCharisma2"&&s.owner?.side&&G?.roundStarter&&s.owner.side!==G.roundStarter){
    return "+2 Technique / +2 Charisme";
  }
  return "";
}

function announceOpeningRoundEffect(owner){
  const s=owner?.cat;
  const orderEffect=turnOrderEffectLabel(s);
  const effect=openingRoundEffectLabel(s)||orderEffect;
  if(!effect)return;
  const timing=orderEffect?"Joue en second":(isMatchRoundOneAbility(wrestlerAbility(s))?"Round 1":"Premier round");
  log(`[EFFET] ${s.card.name} : ${timing}, ${effect}.`);
  showEffectFeedback(s.card,s.card.name,`${timing} : ${effect}`,"buff",2200);
}

function tutorDeckCards(owner,source,types){
  const queue=[...types];
  const chooseNext=()=>{
    const type=queue.shift();
    if(!type)return;
    const candidates=owner.deck.filter(card=>card.type===type);
    if(!candidates.length){
      log(`[EFFET] ${source.name} : aucun ${type==="Manager"?"bonus":"objet"} dans le deck.`);
      chooseNext();
      return;
    }
    const takeCard=cardId=>{
      const index=owner.deck.findIndex(card=>card.id===cardId);
      if(index<0)return;
      const [card]=owner.deck.splice(index,1);
      owner.hand.push(card);
      log(`[EFFET] ${source.name} ajoute ${card.name} à la main.`);
      showEffectFeedback(source,source.name,`Récupère ${card.name}`,"special");
      markOnlineDirty();
      render();
      chooseNext();
    };
    if(owner.side==="player"){
      requestEffectChoice({
        title:source.name,
        text:`Choisis un${type==="Manager"?" bonus":" objet"} dans ton deck.`,
        choices:candidates.map(card=>({label:card.name,value:card.id})),
        onChoose:takeCard
      });
    }else{
      takeCard(candidates[Math.floor(Math.random()*candidates.length)].id);
    }
  };
  chooseNext();
}

function recoverNamedWrestler(owner,source,names){
  const candidates=[...owner.deck.map(card=>({card,zone:"deck"})),...owner.grave.map(card=>({card,zone:"grave"}))]
    .filter(entry=>names.includes(entry.card.name));
  if(!candidates.length){
    log(`[EFFET] ${source.name} : aucun ${names.join(" ou ")} dans le deck ou le vestiaire.`);
    return;
  }
  const recover=value=>{
    const [zone,id]=value.split(":");
    const collection=zone==="deck"?owner.deck:owner.grave;
    const index=collection.findIndex(card=>card.id===id);
    if(index<0)return;
    const [card]=collection.splice(index,1);
    owner.hand.push(card);
    log(`[EFFET] ${source.name} récupère ${card.name} depuis ${zone==="deck"?"le deck":"le vestiaire"}.`);
    showEffectFeedback(source,source.name,`Récupère ${card.name}`,"special");
    markOnlineDirty();
    render();
  };
  if(owner.side!=="player"){
    const pick=candidates[Math.floor(Math.random()*candidates.length)];
    recover(`${pick.zone}:${pick.card.id}`);
    return;
  }
  requestEffectChoice({
    title:source.name,
    text:"Choisis le catcheur à récupérer.",
    choices:candidates.map(({card,zone})=>({label:`${card.name} (${zone==="deck"?"deck":"vestiaire"})`,value:`${zone}:${card.id}`})),
    onChoose:recover
  });
}

function applyWrestlerEntryEffect(owner,c){
  if(owner.wrestlerEffectsBlocked&&c.ability){
    log(`[EFFET] ${c.name} est annulé par le bonus adverse.`);
    showEffectFeedback(c,c.name,"Effet annulé","block");
    return;
  }
  if(c.ability==="objectExtra1"){
    owner.objectDurationBonus=Math.max(owner.objectDurationBonus||0,1);
    log(`[EFFET] ${c.name} : les objets qui lui sont équipés durent 2 tours.`);
    showEffectFeedback(c,c.name,"Objets : 2 tours","special");
  }
  if(c.ability==="drawToSixBonusStats"){
    const before=owner.hand.length;
    while(owner.hand.length<6){
      const count=owner.hand.length;
      draw(owner,1);
      if(owner.hand.length===count)break;
    }
    const drawn=owner.hand.slice(before);
    const bonuses=drawn.filter(card=>card.type==="Manager");
    bonuses.forEach(()=>{
      const stat=STATS[Math.floor(Math.random()*STATS.length)];
      owner.cat.mods[stat]+=1;
    });
    log(`[EFFET] ${c.name} pioche ${drawn.length} carte${drawn.length>1?"s":""} jusqu'à 6 en main${bonuses.length?` : +${bonuses.length} point${bonuses.length>1?"s":""} aléatoire${bonuses.length>1?"s":""}`:""}.`);
    showEffectFeedback(c,c.name,`Pioche +${drawn.length}${bonuses.length?` / +${bonuses.length} stat${bonuses.length>1?"s":""}`:""}`,"special");
  }
  if(c.ability==="recoverJaydonOrFenrir")recoverNamedWrestler(owner,c,["Jaydon Ross","Fenrir Strom"]);
  if(c.ability==="revealObjectHandCharSpeed"){
    const object=owner.hand.find(card=>card.type==="Objet");
    if(object){
      owner.cat.mods.Charisme+=2;
      owner.cat.mods.Vitesse+=1;
      log(`[EFFET] ${c.name} révèle ${object.name} : +2 Charisme et +1 Vitesse.`);
      showEffectFeedback(c,c.name,"+2 Charisme / +1 Vitesse","buff");
    }else log(`[EFFET] ${c.name} : aucun objet à révéler en main.`);
  }
  if(c.ability==="firstRoundOpponentMill1"){
    const enemy=owner.side==="player"?G.ai:G.player;
    const milled=enemy.deck.pop();
    if(milled){
      enemy.grave.push(milled);
      log(`[EFFET] ${c.name} envoie ${milled.name}, au-dessus du deck de ${enemy.label}, au vestiaire.`);
      showEffectFeedback(c,c.name,"Carte adverse au vestiaire","malus");
    }else log(`[EFFET] ${c.name} : deck adverse vide.`);
  }
  if(c.ability==="drawOnEntry1"||c.ability==="drawOnEntry2"){
    const amount=c.ability==="drawOnEntry2"?2:1;
    const before=owner.hand.length;
    draw(owner,amount);
    const drawn=owner.hand.length-before;
    if(drawn){
      log(`${owner.label} pioche ${drawn} carte${drawn>1?"s":""} grâce à ${c.name}.`);
      showEffectFeedback(c,c.name,`Pioche +${drawn}`,"special");
    }
  }
  if(c.ability==="entryIfTrevorInGraveFTV1"){
    const hasTrevor=owner.grave.some(card=>card.name==="Trevor Mayden");
    if(hasTrevor){
      owner.cat.mods.Force+=1;
      owner.cat.mods.Technique+=1;
      owner.cat.mods.Vitesse+=1;
      log(`[EFFET] ${c.name} retrouve Trevor Mayden au vestiaire : +1 Force / +1 Technique / +1 Vitesse.`);
      showEffectFeedback(c,c.name,"+1 Force / Technique / Vitesse","buff");
    }else{
      log(`[EFFET] ${c.name} : Trevor Mayden absent du vestiaire.`);
    }
  }
  if(c.ability==="entryIfZerkInHandDiscard1"){
    const hasZerk=owner.hand.some(card=>card.key==="standard_catcheurs_the_butcher_zerk"||card.key==="rare_catcheurs_the_butcher_zerk");
    const enemy=owner.side==="player"?G.ai:G.player;
    if(hasZerk&&enemy.hand.length){
      const index=Math.floor(Math.random()*enemy.hand.length);
      const [discarded]=enemy.hand.splice(index,1);
      enemy.grave.push(discarded);
      log(`[EFFET] ${c.name} révèle The Butcher Zerk : ${enemy.label} défausse ${discarded.name}.`);
      showEffectFeedback(c,c.name,"Défausse adverse","malus");
    }else if(!hasZerk){
      log(`[EFFET] ${c.name} : The Butcher Zerk n'est pas en main.`);
    }
  }
  if(c.ability==="recoverObjectGrave"){
    const index=owner.grave.map(card=>card.type).lastIndexOf("Objet");
    if(index>=0){
      const [recovered]=owner.grave.splice(index,1);
      owner.hand.push(recovered);
      log(`[EFFET] ${c.name} récupère ${recovered.name} depuis le vestiaire.`);
      showEffectFeedback(c,c.name,`Récupère ${recovered.name}`,"special");
    }else{
      log(`[EFFET] ${c.name} : aucun objet à récupérer au vestiaire.`);
    }
  }
  if(c.ability==="tutorManagerFromDeck")tutorDeckCards(owner,c,["Manager"]);
  if(c.ability==="tutorManagerObjectFromDeck")tutorDeckCards(owner,c,["Manager","Objet"]);
  if(c.ability==="smsRecoverTags2"&&!owner.oncePerMatch?.smsRecoverTags2){
    owner.oncePerMatch=owner.oncePerMatch||{};
    owner.oncePerMatch.smsRecoverTags2=true;
    const before=Number.isFinite(owner.tagsRemaining)?owner.tagsRemaining:TAGS_PER_MATCH;
    owner.tagsRemaining=Math.min(TAGS_PER_MATCH,before+2);
    const gained=owner.tagsRemaining-before;
    const feedback=gained ? `TAG +${gained}` : "TAG déjà au max";
    log(`[EFFET] ${c.name} : ${feedback}.`);
    showEffectFeedback(c,c.name,feedback,gained?"special":"block");
  }
  if((c.ability==="starterSpeed2"||c.ability==="starterSpeedTechnique2"||c.ability==="starterTechniqueCharisma1")&&G.turnsTaken===0&&G.currentTurn===owner.side){
    if(c.ability==="starterTechniqueCharisma1"){
      owner.cat.mods.Technique+=1;
      owner.cat.mods.Charisme+=1;
      const feedback="+1 Technique, +1 Charisme";
      log(`${c.name} profite de l'ouverture : ${feedback}.`);
      showEffectFeedback(c,c.name,feedback,"buff");
      return;
    }
    owner.cat.mods.Vitesse+=2;
    let feedback="+2 Vitesse";
    if(c.ability==="starterSpeedTechnique2"){
      owner.cat.mods.Technique+=2;
      feedback+=", +2 Technique";
    }
    log(`${c.name} profite de l'ouverture : ${feedback}.`);
    showEffectFeedback(c,c.name,feedback,"buff");
  }
  if(c.ability==="pinShield"||c.ability==="pinShield20"||c.ability==="pinDual20Shield10"){
    const shield=c.ability==="pinShield20"?20:10;
    owner.pinShield=(owner.pinShield||0)+shield;
    log(`${owner.label} protège son prochain tombé adverse (-${shield}).`);
    showEffectFeedback(c,c.name,`Tombé adverse -${shield}`,"block");
  }
  if(c.ability==="pinDual20Shield10"){
    owner.cat.pin+=20;
    showEffectFeedback(c,c.name,"Tombé +20","pin");
  }
  if(c.ability==="entryPinBonus20"){
    owner.cat.pin+=20;
    log(`[EFFET] ${c.name} arrive avec un prochain tombé +20.`);
    showEffectFeedback(c,c.name,"Tombé +20","pin");
  }
  if(c.ability==="recoverGrave"||c.ability==="recoverGraveDiscard1"){
    const recovered=owner.grave.pop();
    if(recovered){
      owner.hand.push(recovered);
      log(`[EFFET] ${c.name} récupère ${recovered.name} depuis le vestiaire.`);
      showEffectFeedback(c,c.name,`Récupère ${recovered.name}`,"block");
    }else{
      log(`[EFFET] ${c.name} : aucune carte à récupérer au vestiaire.`);
    }
    if(c.ability==="recoverGraveDiscard1"){
      const enemy=owner.side==="player"?G.ai:G.player;
      const discardIndex=enemy.hand.length?Math.floor(Math.random()*enemy.hand.length):-1;
      if(discardIndex>=0){
        const [discarded]=enemy.hand.splice(discardIndex,1);
        enemy.grave.push(discarded);
        log(`[EFFET] ${c.name} force ${enemy.label} à défausser ${discarded.name}.`);
        showEffectFeedback(c,c.name,"Défausse adverse","malus");
      }else{
        log(`[EFFET] ${c.name} : adversaire sans carte à défausser.`);
      }
    }
  }
  if(c.ability==="opponentDiscardChoice1"){
    const enemy=owner.side==="player"?G.ai:G.player;
    const discarded=enemy.hand.pop();
    if(discarded){
      enemy.grave.push(discarded);
      log(`[EFFET] ${c.name} force ${enemy.label} à défausser ${discarded.name}.`);
      showEffectFeedback(c,c.name,"Défausse adverse","malus");
    }else{
      log(`[EFFET] ${c.name} : adversaire sans carte à défausser.`);
    }
  }
  if(c.ability==="revealOpponentHand"){
    const enemy=owner.side==="player"?G.ai:G.player;
    const names=enemy.hand.length ? enemy.hand.map(card=>card.name).join(", ") : "main vide";
    log(`[EFFET] ${c.name} révèle la main de ${enemy.label} : ${names}.`);
    showEffectFeedback(c,c.name,"Main adverse révélée","special");
  }
}

function applyRoundManagerEffects(){
  [G.player,G.ai].forEach(owner=>{
    const opp=owner.side==="player"?G.ai:G.player;
    const catAbility=wrestlerAbility(owner.cat);
    if(catAbility==="turnCatRandom2"||catAbility==="turnCatRandom3"){
      const value=catAbility==="turnCatRandom3"?3:2;
      const [stat]=replaceRoundRandomBonus(owner.cat,value);
      log(`[EFFET] ${owner.cat.card.name} relance son bonus : +${value} ${stat}.`);
      showEffectFeedback(owner.cat.card,owner.cat.card.name,`+${value} ${stat}`,"buff");
    }
    if((catAbility==="turnEnemyForceMinus1"||catAbility==="turnEnemyForceMinus2")&&opp.cat){
      const value=catAbility==="turnEnemyForceMinus2"?2:1;
      opp.cat.mods.Force-=value;
      log(`${owner.cat.card.name} affaiblit ${opp.cat.card.name} : -${value} Force.`);
      showEffectFeedback(opp.cat.card,owner.cat.card.name,`-${value} Force`,"malus");
    }
    if(catAbility==="turnEnemySpeedMinus1"&&opp.cat){
      opp.cat.mods.Vitesse-=1;
      log(`${owner.cat.card.name} affaiblit ${opp.cat.card.name} : -1 Vitesse.`);
      showEffectFeedback(opp.cat.card,owner.cat.card.name,"-1 Vitesse","malus");
    }
    if(catAbility==="turnCatRandomPermanent1Max5"||catAbility==="turnCatRandomPermanent2Max3"){
      const value=catAbility==="turnCatRandomPermanent2Max3"?2:1;
      const max=catAbility==="turnCatRandomPermanent2Max3"?3:5;
      const count=owner.cat.permanentGrowthCount||0;
      if(count<max){
        const stat=STATS[Math.floor(Math.random()*STATS.length)];
        owner.cat.mods[stat]+=value;
        owner.cat.permanentGrowthCount=count+1;
        log(`[EFFET] ${owner.cat.card.name} progresse : +${value} ${stat} (${count+1}/${max}).`);
        showEffectFeedback(owner.cat.card,owner.cat.card.name,`+${value} ${stat} (${count+1}/${max})`,"buff");
      }
    }
    if(catAbility==="revealDanEachRoundTechSpeed2"){
      const hasDan=owner.hand.some(card=>card.key==="rare_catcheurs_dan_nocas");
      if(hasDan&&owner.cat.danRevealRound!==G.round){
        owner.cat.danRevealRound=G.round;
        owner.cat.mods.Technique+=2;
        owner.cat.mods.Vitesse+=2;
        log(`[EFFET] ${owner.cat.card.name} révèle Dan Nocas : +2 Technique et +2 Vitesse.`);
        showEffectFeedback(owner.cat.card,owner.cat.card.name,"+2 Technique / +2 Vitesse","buff");
      }
    }
    if(catAbility==="revealCharlieEachRoundForcePin"){
      const hasCharlie=owner.hand.some(card=>card.name==="Charlie Bergson");
      if(hasCharlie&&owner.cat.trevorRevealRound!==G.round){
        owner.cat.trevorRevealRound=G.round;
        owner.cat.mods.Force+=1;
        owner.cat.pin+=20;
        log(`[EFFET] ${owner.cat.card.name} révèle Charlie Bergson : +1 Force et +20 Tombé.`);
        showEffectFeedback(owner.cat.card,owner.cat.card.name,"+1 Force / Tombé +20","buff");
      }
    }
    if(owner.man?.ability==="bonusPureTraditionDrawTeam"){
      const amount=["Romain Lestrange","Zaeken"].includes(owner.cat?.card?.name)?2:1;
      const before=owner.hand.length;
      draw(owner,amount);
      const drawn=owner.hand.length-before;
      if(drawn){
        log(`[EFFET] ${owner.man.name} : ${owner.label} pioche ${drawn} carte${drawn>1?"s":""}.`);
        showEffectFeedback(owner.cat?.card||owner.man,owner.man.name,`Pioche +${drawn}`,"special");
      }
    }
    if(owner.man?.ability==="ringsiderRecover1LoseTag"||owner.man?.ability==="ringsiderRecover2LoseTag"){
      if((owner.tagsRemaining??TAGS_PER_MATCH)>0&&owner.grave.length){
        const amount=owner.man.ability==="ringsiderRecover2LoseTag"?2:1;
        const recovered=[];
        for(let i=0;i<amount&&owner.grave.length;i++){
          const card=owner.grave.pop();
          owner.hand.push(card);
          recovered.push(card.name);
        }
        owner.tagsRemaining=Math.max(0,(owner.tagsRemaining??TAGS_PER_MATCH)-1);
        log(`[EFFET] ${owner.man.name} récupère ${recovered.join(", ")} et dépense 1 TAG.`);
        showEffectFeedback(owner.cat?.card||owner.man,owner.man.name,`Récupère ${recovered.length} / TAG -1`,"special");
      }
    }
    if(owner.man?.ability==="turnEnemyPinMinus10"){
      opp.pinShield=(opp.pinShield||0)+10;
      log(`[EFFET] ${owner.man.name} protège le prochain tombé adverse : -10.`);
      showEffectFeedback(owner.cat?.card||owner.man,owner.man.name,"Tombé adverse -10","block");
    }

    const permanentChanceByAbility={turnRandomPermanent10:0.1,turnRandomPermanent20:0.2,turnRandomPermanent30:0.3};
    const supportCard=permanentChanceByAbility[owner.man?.ability]?owner.man:owner.cat?.card;
    const chance=permanentChanceByAbility[supportCard?.ability]||0;
    if(!chance||!owner.cat)return;
    if(Math.random()<chance){
      const stat=STATS[Math.floor(Math.random()*STATS.length)];
      owner.cat.mods[stat]+=1;
      owner.cat.permanentMods=normalizeMods(owner.cat.permanentMods);
      owner.cat.permanentMods[stat]+=1;
      owner.cat.card.permanentMods={...owner.cat.permanentMods};
      log(`[EFFET] ${supportCard.name} inspire ${owner.cat.card.name} : +1 ${stat}.`);
      showEffectFeedback(owner.cat.card,supportCard.name,`+1 ${stat}`,"buff");
    }
  });
}

function addTrackedStat(effect,s,stat,value){
  if(!s||!stat||!value)return;
  s.mods[stat]+=value;
  effect.mods=effect.mods||{};
  effect.mods[stat]=(effect.mods[stat]||0)+value;
}

function addTrackedAllStats(effect,s,value){
  STATS.forEach(stat=>addTrackedStat(effect,s,stat,value));
}

function addTrackedRandomStats(effect,s,count,value=1){
  const pool=shuffle([...STATS]).slice(0,count);
  pool.forEach(stat=>addTrackedStat(effect,s,stat,value));
  return pool;
}

function applyTrackedObjectEffect(owner,opp,c,choice=null){
  const s=owner.cat;
  if(!s)return;
  const effect={targetSide:owner.side,mods:{},pin:0,pinShield:0,save:false};
  let feedback="";
  let kind="buff";

  switch(c.ability){
    case"mForce1":addTrackedStat(effect,s,"Force",1);feedback="+1 Force";break;
    case"mForce":addTrackedStat(effect,s,"Force",2);feedback="+2 Force";break;
    case"mForce3":addTrackedStat(effect,s,"Force",3);feedback="+3 Force";break;
    case"mVitesse":addTrackedStat(effect,s,"Vitesse",2);feedback="+2 Vitesse";break;
    case"mVitesse1":addTrackedStat(effect,s,"Vitesse",1);feedback="+1 Vitesse";break;
    case"mTechnique":addTrackedStat(effect,s,"Technique",2);feedback="+2 Technique";break;
    case"mCharisme1":addTrackedStat(effect,s,"Charisme",1);feedback="+1 Charisme";break;
    case"mCharisme":addTrackedStat(effect,s,"Charisme",2);feedback="+2 Charisme";break;
    case"mCharisme3":addTrackedStat(effect,s,"Charisme",3);feedback="+3 Charisme";break;
    case"mCharisma2SpeedMinus1":
      addTrackedStat(effect,s,"Charisme",2);
      addTrackedStat(effect,s,"Vitesse",-1);
      feedback="+2 Charisme / -1 Vitesse";
      break;
    case"mAll1":addTrackedAllStats(effect,s,1);feedback="+1 partout";break;
    case"mAll2":addTrackedAllStats(effect,s,2);feedback="+2 partout";break;
    case"mAll2IfGrave3":{
      const wrestlersInGrave=owner.grave.filter(card=>card.type==="Catcheur").length;
      if(wrestlersInGrave>=3){
        addTrackedAllStats(effect,s,2);
        feedback="+2 partout";
      }else{
        feedback="Condition non remplie";
        kind="block";
        log(`${c.name} attend 3 catcheurs au vestiaire (${wrestlersInGrave}/3).`);
      }
      break;
    }
    case"mAll3":addTrackedAllStats(effect,s,3);feedback="+3 partout";break;
    case"mRandom":{
      const [stat]=addTrackedRandomStats(effect,s,1);
      feedback=`+1 ${stat}`;
      break;
    }
    case"mRandom2":{
      const stats=addTrackedRandomStats(effect,s,2);
      feedback=stats.map(stat=>`+1 ${stat}`).join(" / ");
      break;
    }
    case"mSave":s.save=true;effect.save=true;feedback="Sauvetage";kind="block";break;
    case"pinShield5":
      owner.pinShield=(owner.pinShield||0)+5;
      effect.pinShield=5;
      feedback="Tombé adverse -5";
      kind="block";
      break;
    case"pinObject5":
      s.pin+=5;
      effect.pin=5;
      feedback="Tombé +5";
      kind="pin";
      break;
    case"pinObject20":{
      if(choice==="charisme"){
        addTrackedStat(effect,s,"Charisme",2);
        feedback="+2 Charisme";
        kind="buff";
      }else{
        s.pin+=20;
        effect.pin=20;
        feedback="Tombé +20";
        kind="pin";
      }
      break;
    }
    case"drawNext1":
      owner.nextDrawBonus=(owner.nextDrawBonus||0)+1;
      feedback="Pioche +1";
      kind="special";
      break;
    case"recoverGrave":{
      const recovered=owner.grave.pop();
      if(recovered){
        owner.hand.push(recovered);
        feedback=`Récupère ${recovered.name}`;
        kind="block";
      }
      break;
    }
    case"opponentDiscard1":{
      const discarded=opp.hand.pop();
      if(discarded){
        opp.grave.push(discarded);
        feedback="Défausse adverse";
        kind="malus";
      }
      break;
    }
  }

  const hasTrackedChange=Object.keys(effect.mods).length||effect.pin||effect.pinShield||effect.save;
  owner.objEffect=hasTrackedChange?effect:null;
  if(feedback){
    log(`[EFFET] ${c.name} : ${feedback}.`);
    showEffectFeedback(s.card,c.name,feedback,kind);
  }
  markOnlineDirty();
}

function revertActiveObject(owner,sendToGrave=true,preserveNextDraw=false){
  if(!owner)return;
  const effect=owner.objEffect;
  if(effect){
    const target=owner.cat;
    if(target){
      Object.entries(effect.mods||{}).forEach(([stat,value])=>{
        target.mods[stat]-=value;
      });
      if(effect.pin)target.pin-=effect.pin;
      if(effect.save)target.save=false;
    }
    if(effect.pinShield)owner.pinShield=Math.max(0,(owner.pinShield||0)-effect.pinShield);
  }
  if(owner.obj?.ability==="drawNext1"&&!preserveNextDraw)owner.nextDrawBonus=0;
  if(owner.obj&&sendToGrave)owner.grave.push(owner.obj);
  owner.obj=null;
  owner.objEffect=null;
  owner.objTurnsRemaining=0;
  owner.objLastActivationRound=null;
  owner.objExtraDrawQueued=false;
}

function releaseSupportEffects(owner,opp){
  if(!owner)return;
  switch(owner.man?.ability){
    case"cancelObjects":
      if(opp)opp.objectsBlocked=false;
      break;
    case"cancelAllObjects":
      owner.objectsBlocked=false;
      if(opp)opp.objectsBlocked=false;
      break;
    case"cancelObjectsManagers":
      if(opp){
        opp.objectsBlocked=false;
        opp.managersBlocked=false;
      }
      break;
    case"cancelOpponentWrestlerEffects":
      if(opp)opp.wrestlerEffectsBlocked=false;
      break;
  }
  owner.objectDurationBonus=0;
}

function wrestlerAbility(s){
  if(!s||s.owner?.wrestlerEffectsBlocked)return null;
  return s.card?.ability || null;
}

function cardFromTaggedState(catState){
  const card=cloneCard(catState.card);
  card.id=Math.random().toString(36).slice(2);
  const permanentMods=normalizeMods(catState.permanentMods);
  if(STATS.some(stat=>permanentMods[stat]))card.permanentMods=permanentMods;
  else delete card.permanentMods;
  return card;
}

function canTagPlayer(){
  if(!G||G.over||G.resolving||G.discarding||G.tagging)return false;
  if(G.currentTurn!=="player")return false;
  const p=G.player;
  if(!p?.cat)return false;
  if((p.tagsRemaining??TAGS_PER_MATCH)<=0)return false;
  return p.hand.some(card=>card.type==="Catcheur");
}

function tagPlayer(){
  if(!G||G.over||G.resolving)return;
  if(G.discarding==="player"){
    playSound("erreur");
    log("Termine la défausse avant de faire un TAG.");
    return;
  }
  if(G.currentTurn!=="player"){
    playSound("erreur");
    log("Ce n'est pas le tour du Joueur.");
    return;
  }
  const p=G.player;
  const opp=G.ai;
  if(!p.cat){
    playSound("erreur");
    log("Il faut un catcheur sur le ring pour faire un TAG.");
    return;
  }
  p.tagsRemaining=Number.isFinite(p.tagsRemaining)?p.tagsRemaining:TAGS_PER_MATCH;
  if(p.tagsRemaining<=0){
    playSound("erreur");
    log("TAG épuisés pour ce match.");
    return;
  }
  if(!p.hand.some(card=>card.type==="Catcheur")){
    playSound("erreur");
    log("Aucun catcheur en main pour prendre le relais.");
    return;
  }

  const outgoing=p.cat;
  const returned=cardFromTaggedState(outgoing);
  releaseSupportEffects(p,opp);
  if(p.man){
    p.grave.push(p.man);
    p.man=null;
  }
  revertActiveObject(p,true);
  p.cat=null;
  p.hand.push(returned);
  p.tagLockedCardId=returned.id;
  p.tagsRemaining-=1;
  p.played.Catcheur=false;
  G.tagging="player";
  playSound("clic");
  log(`[TAG] ${outgoing.card.name} revient en main. Bonus et objet partent au vestiaire.`);
  showEffectFeedback(returned,"TAG","Relais demandé","special");
  markOnlineDirty();
  render();
}

function applyEffect(owner,opp,c){
  let s=owner.cat;
  if(!s)return;
  let feedback="";
  let kind="buff";
  switch(c.ability){
    case"mForce1":s.mods.Force+=1;feedback="+1 Force";break;
    case"mForce":s.mods.Force+=2;feedback="+2 Force";break;
    case"mForce3":s.mods.Force+=3;feedback="+3 Force";break;
    case"mVitesse":s.mods.Vitesse+=2;feedback="+2 Vitesse";break;
    case"mVitesse1":s.mods.Vitesse+=1;feedback="+1 Vitesse";break;
    case"mTechnique":s.mods.Technique+=2;feedback="+2 Technique";break;
    case"mCharisme1":s.mods.Charisme+=1;feedback="+1 Charisme";break;
    case"mCharisme":s.mods.Charisme+=2;feedback="+2 Charisme";break;
    case"mCharisme3":s.mods.Charisme+=3;feedback="+3 Charisme";break;
    case"mAll1":addAllStats(s,1);feedback="+1 partout";break;
    case"mAll2":addAllStats(s,2);feedback="+2 partout";break;
    case"mAll2IfGrave3":{
      const wrestlersInGrave=owner.grave.filter(card=>card.type==="Catcheur").length;
      if(wrestlersInGrave>=3){
        addAllStats(s,2);
        feedback="+2 partout";
      }else{
        feedback="Condition non remplie";
        kind="block";
        log(`${c.name} attend 3 catcheurs au vestiaire (${wrestlersInGrave}/3).`);
      }
      break;
    }
    case"mAll3":addAllStats(s,3);feedback="+3 partout";break;
    case"bonusOdysseeTechForceTeam":{
      const amount=["Charlie Bergson","Trevor Mayden"].includes(s.card.name)?2:1;
      s.mods.Technique+=amount;
      s.mods.Force+=amount;
      feedback=`+${amount} Technique / +${amount} Force`;
      break;
    }
    case"bonusPassionForceCharTeam":{
      const amount=["Black Sam","Angelo Folena"].includes(s.card.name)?2:1;
      s.mods.Force+=amount;
      s.mods.Charisme+=amount;
      feedback=`+${amount} Force / +${amount} Charisme`;
      break;
    }
    case"bonusPfiCharSpeedTeam":{
      const amount=["Ethan Riley","Maxime Cuadrado"].includes(s.card.name)?2:1;
      s.mods.Charisme+=amount;
      s.mods.Vitesse+=amount;
      feedback=`+${amount} Charisme / +${amount} Vitesse`;
      break;
    }
    case"mRandom":{
      const [stat]=addRandomStats(s,1);
      feedback=`+1 ${stat}`;
      break;
    }
    case"mRandom2":{
      const stats=addRandomStats(s,2);
      feedback=stats.map(stat=>`+1 ${stat}`).join(" / ");
      break;
    }
    case"mSave":s.save=true;feedback="Sauvetage";kind="block";break;
    case"pinShield5":owner.pinShield=(owner.pinShield||0)+5;feedback="Tombé adverse -5";kind="block";break;
    case"pinObject5":s.pin+=5;feedback="Tombé +5";kind="pin";break;
    case"pinObject20":s.pin+=20;feedback="Tombé +20";kind="pin";break;
    case"drawNext1":owner.nextDrawBonus=(owner.nextDrawBonus||0)+1;feedback="Pioche +1";kind="special";break;
    case"recoverGrave":{
      const recovered=owner.grave.pop();
      if(recovered){owner.hand.push(recovered);feedback=`Récupère ${recovered.name}`;kind="block";}
      break;
    }
    case"opponentDiscard1":{
      const discarded=opp.hand.pop();
      if(discarded){opp.grave.push(discarded);feedback="Défausse adverse";kind="malus";}
      break;
    }
    case"cancelObjects":{
      opp.objectsBlocked=true;
      if(opp.obj)revertActiveObject(opp,true);
      feedback="Objets adverses annulés";
      kind="block";
      break;
    }
    case"cancelAllObjects":{
      owner.objectsBlocked=true;
      opp.objectsBlocked=true;
      if(owner.obj)revertActiveObject(owner,true);
      if(opp.obj)revertActiveObject(opp,true);
      feedback="Tous les objets annulés";
      kind="block";
      break;
    }
    case"cancelObjectsManagers":{
      opp.objectsBlocked=true;
      opp.managersBlocked=true;
      if(opp.obj)revertActiveObject(opp,true);
      if(opp.man){
        opp.grave.push(opp.man);
        opp.man=null;
      }
      feedback="Objets et bonus adverses annulés";
      kind="block";
      break;
    }
    case"cancelOpponentWrestlerEffects":{
      opp.wrestlerEffectsBlocked=true;
      feedback="Effets catcheurs adverses annulés";
      kind="block";
      break;
    }
    case"objectExtra1":owner.objectDurationBonus=Math.max(owner.objectDurationBonus||0,1);feedback="Objet +1 tour";kind="special";break;
    case"objectExtra2":owner.objectDurationBonus=Math.max(owner.objectDurationBonus||0,2);feedback="Objet +2 tours";kind="special";break;
    case"objectExtra2Weakest":{
      owner.objectDurationBonus=Math.max(owner.objectDurationBonus||0,2);
      const weakest=STATS.reduce((best,stat)=>(s.card.stats?.[stat]||0)+s.mods[stat] < (s.card.stats?.[best]||0)+s.mods[best] ? stat : best,STATS[0]);
      s.mods[weakest]+=1;
      feedback=`Objet +2 tours / +1 ${weakest}`;
      kind="special";
      log(`${c.name} renforce ${weakest} (+1).`);
      break;
    }
  }
  if(feedback){
    log(`[EFFET] ${c.name} : ${feedback}.`);
    showEffectFeedback(s.card,c.name,feedback,kind);
  }
}

function playPlayer(idx){
  if(G.over||G.resolving)return;
  if(G.discarding==="player"){
    discardPlayerCard(idx);
    return;
  }
  if(G.currentTurn!=="player"){
    playSound("erreur");
    log("Ce n'est pas le tour du Joueur.");
    return;
  }
  const c=G.player.hand[idx];
  if(!c)return;
  if(G.tagging==="player"&&c.type!=="Catcheur"){
    playSound("erreur");
    log("Choisis un catcheur pour terminer le TAG.");
    return;
  }
  playCard(G.player,G.ai,c,idx,true);
  markOnlineDirty();
  render();
}

function triggerLudovicSupportDiscard(player,opponent,playedCard){
  if(opponent?.man?.ability!=="opponentDiscardOnSupport")return;
  if(playedCard.type!=="Manager"&&playedCard.type!=="Objet")return;
  if(!player.hand.length){
    log(`[EFFET] ${opponent.man.name} : ${player.label} n'a aucune carte à défausser.`);
    return;
  }
  const index=Math.floor(Math.random()*player.hand.length);
  const [discarded]=player.hand.splice(index,1);
  player.grave.push(discarded);
  log(`[EFFET] ${opponent.man.name} : ${player.label} défausse ${discarded.name} après avoir joué ${playedCard.name}.`);
  showEffectFeedback(opponent.cat?.card||opponent.man,opponent.man.name,"Défausse adverse","malus");
}

function playCard(p,opp,c,idx,announce=false){
  if(c.type==="Catcheur"){
    if(G.tagging===p.side&&c.id===p.tagLockedCardId)return announce&&log("Ce catcheur vient de sortir : choisis un autre relais.");
    if(p.played.Catcheur||p.cat)return announce&&log("Vous avez déjà un catcheur.");
    p.cat=state(c);
    p.cat.owner=p;
    applyPendingEntryMods(p,p.cat);
    applyWrestlerEntryEffect(p,c);
    announceOpeningRoundEffect(p);
    p.played.Catcheur=true;
    p.hand.splice(idx,1);
    if(G.tagging===p.side){
      G.tagging=null;
      p.tagLockedCardId=null;
      log(`[TAG] ${c.name} prend le relais.`);
    }
  } else if(c.type==="Manager"){
    if(G.tagging===p.side)return announce&&log("Choisis un catcheur pour terminer le TAG.");
    if(p.played.Manager||!p.cat)return announce&&log("Il faut un catcheur pour jouer un bonus.");
    if(p.managersBlocked){
      p.grave.push(c);
      p.hand.splice(idx,1);
      return announce&&log(`${c.name} est annulé.`);
    }
    if(p.man)return announce&&log("Ce catcheur a déjà un bonus.");
    p.man=c;
    p.played.Manager=true;
    p.cat.managers++;
    p.hand.splice(idx,1);
    applyEffect(p,opp,c);
    triggerLudovicSupportDiscard(p,opp,c);
  } else if(c.type==="Objet"){
    if(G.tagging===p.side)return announce&&log("Choisis un catcheur pour terminer le TAG.");
    if(!p.cat)return announce&&log("Il faut un catcheur pour jouer un objet.");
    if(p.objectsBlocked){
      p.grave.push(c);
      p.hand.splice(idx,1);
      return announce&&log(`${c.name} est annulé.`);
    }
    if(p.obj){
      return announce&&log("Un objet est déjà actif.");
    }
    p.obj=c;
    p.objTurnsRemaining=1+Number(p.objectDurationBonus||0);
    p.objLastActivationRound=G.round;
    p.objExtraDrawQueued=false;
    p.played.Objet=true;
    p.hand.splice(idx,1);
    triggerLudovicSupportDiscard(p,opp,c);
    if(p.objTurnsRemaining>1)log(`${c.name} restera actif ${p.objTurnsRemaining} tours.`);
    if(c.ability==="pinObject20"&&p.side==="player"){
      requestEffectChoice({
        title:c.name,
        text:"Choisis l'effet à appliquer.",
        choices:[
          {label:"+2 Charisme",value:"charisme"},
          {label:"+20 Tombé",value:"pin"}
        ],
        onChoose:choice=>{
          applyTrackedObjectEffect(p,opp,c,choice);
          markOnlineDirty();
          render();
        }
      });
      markOnlineDirty();
      return;
    }else{
      const aiChoice=c.ability==="pinObject20" ? (Math.random()<.8 ? "charisme" : "pin") : null;
      applyTrackedObjectEffect(p,opp,c,aiChoice);
    }
  }
  playSound("carte_jouee");
  if(announce)log(`${p.label} : <b>${c.name}</b>.`);
  markOnlineDirty();
}

function aiTurnSequence(){
  if(G?.mode==="online")return;
  if(G.over||G.resolving||G.currentTurn!=="ai")return;

  const steps=[
    ()=>aiPlayOne("Catcheur"),
    ()=>aiPlayOne("Manager"),
    ()=>aiPlayOne("Objet")
  ];

  let i=0;
  const run=()=>{
    if(i>=steps.length){
      setTimeout(endTurn,450);
      return;
    }
    steps[i++]();
    render();
    setTimeout(run,450);
  };
  run();
}

function aiPlayOne(type){
  const ai=G.ai,p=G.player;
  if(type==="Catcheur"){
    if(ai.cat||ai.played.Catcheur)return;
    const i=ai.hand.findIndex(x=>x.type==="Catcheur");
    if(i>=0)playCard(ai,p,ai.hand[i],i,true);
  }
  if(type==="Manager"){
    if(!ai.cat||ai.man||ai.played.Manager)return;
    const i=ai.hand.findIndex(x=>x.type==="Manager");
    if(i>=0)playCard(ai,p,ai.hand[i],i,true);
  }
  if(type==="Objet"){
    if(!ai.cat||ai.obj||ai.played.Objet)return;
    const i=ai.hand.findIndex(x=>x.type==="Objet");
    if(i>=0)playCard(ai,p,ai.hand[i],i,true);
  }
}

function passTurn(){
  if(G.over||G.resolving)return;
  if(G.discarding==="player")return;
  if(G.currentTurn!=="player")return;
  log("Le Joueur passe.");
  markOnlineDirty();
  endTurn();
}

function resolveRound(){
  if(G.over||G.resolving)return;
  if(G.discarding==="player")return;
  if(G.currentTurn!=="player")return;
  if(G.tagging==="player"){
    playSound("erreur");
    log("Choisis un catcheur pour terminer le TAG.");
    return;
  }
  markOnlineDirty();
  endTurn();
}

function endTurn(){
  if(G.over||G.resolving||G.discarding)return;
  if(G.tagging){
    if(G.tagging==="player")log("Choisis un catcheur pour terminer le TAG.");
    return;
  }
  const p=activePlayer();
  if(p.hand.length>MAX_HAND_SIZE){
    beginDiscardPhase(p);
    return;
  }
  markOnlineDirty();
  finishEndTurn();
}

function beginDiscardPhase(p){
  if(p.side==="ai"){
    let discarded=0;
    while(p.hand.length>MAX_HAND_SIZE){
      p.grave.push(p.hand.pop());
      discarded++;
    }
    if(discarded)log(p.label+" envoie "+discarded+" carte"+(discarded>1?"s":"")+" au vestiaire pour revenir a "+MAX_HAND_SIZE+".");
    markOnlineDirty();
    finishEndTurn();
    return;
  }
  G.discarding="player";
  const excess=p.hand.length-MAX_HAND_SIZE;
  log("Main limitée à "+MAX_HAND_SIZE+" cartes : choisis "+excess+" carte"+(excess>1?"s":"")+" à envoyer au vestiaire.");
  markOnlineDirty();
  render();
}

function discardPlayerCard(idx){
  if(G.discarding!=="player")return;
  const p=G.player;
  const card=p.hand[idx];
  if(!card)return;
  p.grave.push(card);
  p.hand.splice(idx,1);
  log("Joueur défausse <b>"+card.name+"</b> au vestiaire.");
  markOnlineDirty();
  if(p.hand.length<=MAX_HAND_SIZE){
    G.discarding=null;
    finishEndTurn();
    return;
  }
  render();
}

function finishEndTurn(){
  log(activePlayer().label+" termine son tour.");
  G.turnsTaken++;

  if(G.turnsTaken>=2){
    resolveBattle();
    return;
  }

  G.currentTurn=G.currentTurn==="player"?"ai":"player";
  markOnlineDirty();
  render();
  announceTurn();

  if(G.currentTurn==="ai"&&G.mode!=="online")setTimeout(aiTurnSequence,650);
}

function resolveBattle(){
  G.resolving=true;
  markOnlineDirty();
  render();

  const playerMissing=!G.player.cat;
  const aiMissing=!G.ai.cat;

  if(playerMissing||aiMissing){
    if(G.player.cat&&!G.ai.cat){
      log("Adversaire n'a pas de catcheur disponible : tentative de tombé pour le Joueur.");
      attemptPin(G.player,G.ai);
      return;
    }
    if(G.ai.cat&&!G.player.cat){
      log("Joueur n'a pas de catcheur disponible : tentative de tombé pour l'Adversaire.");
      attemptPin(G.ai,G.player);
      return;
    }
    log("Aucun catcheur sur le ring. Nouveau round.");
    setTimeout(startRound,800);
    return;
  }

  showWheel(()=>duel());
}

function score(s,stat){
  let v=s.card.stats[stat]+s.mods[stat];
  const ability=wrestlerAbility(s);
  if(!ability)return v;
  const firstRound=isRoundEffectActive(s);
  if(ability==="speedPlus"&&stat==="Vitesse")v+=2;
  if(ability==="firstRoundSpeed2"&&firstRound&&stat==="Vitesse")v+=2;
  if(ability==="firstRoundSpeed3"&&firstRound&&stat==="Vitesse")v+=3;
  if(ability==="firstRoundSpeedTechnique1"&&firstRound&&(stat==="Vitesse"||stat==="Technique"))v+=1;
  if(ability==="firstRoundSpeedTechnique2"&&firstRound&&(stat==="Vitesse"||stat==="Technique"))v+=2;
  if(ability==="firstRoundForceTechnique"&&firstRound&&(stat==="Force"||stat==="Technique"))v+=1;
  if(ability==="firstRoundForceTechnique2"&&firstRound&&(stat==="Force"||stat==="Technique"))v+=2;
  if(ability==="firstRoundForceSpeed1"&&firstRound&&(stat==="Force"||stat==="Vitesse"))v+=1;
  if(ability==="firstRoundForceSpeed2"&&firstRound&&(stat==="Force"||stat==="Vitesse"))v+=2;
  if(ability==="firstRoundCharTech"&&firstRound&&(stat==="Charisme"||stat==="Technique"))v+=1;
  if(ability==="firstRoundCharTech2"&&firstRound&&(stat==="Charisme"||stat==="Technique"))v+=2;
  if(ability==="firstRoundForceCharTech"&&firstRound&&(stat==="Force"||stat==="Charisme"||stat==="Technique"))v+=1;
  if(ability==="firstRoundSpeedCharisma3"&&firstRound&&(stat==="Vitesse"||stat==="Charisme"))v+=3;
  if(ability==="techniqueRound1"&&firstRound&&stat==="Technique")v+=3;
  if(ability==="managerOwnedTechForceSpeed1"&&s.owner?.man&&(stat==="Technique"||stat==="Force"||stat==="Vitesse"))v+=1;
  if(ability==="managerOwnedForceSpeed1"&&s.owner?.man&&(stat==="Force"||stat==="Vitesse"))v+=1;
  if(ability==="round2ActiveStat3"&&G.round===2)v+=3;
  if(ability==="round4All1"&&G.round===4)v+=1;
  if(ability==="secondPlayerForceCharisma1"&&s.owner?.side&&G.roundStarter&&s.owner.side!==G.roundStarter&&(stat==="Force"||stat==="Charisme"))v+=1;
  if(ability==="secondPlayerTechnique2"&&s.owner?.side&&G.roundStarter&&s.owner.side!==G.roundStarter&&stat==="Technique")v+=2;
  if(ability==="secondPlayerTechniqueCharisma2"&&s.owner?.side&&G.roundStarter&&s.owner.side!==G.roundStarter&&(stat==="Technique"||stat==="Charisme"))v+=2;
  if(ability==="forcePlus"&&!s.forcePlusUsed&&stat==="Force")v+=2;
  if(ability==="charismaPlus"&&stat==="Charisme")v++;
  return v;
}

function statAbilityFeedback(s,stat){
  if(!s)return null;
  const ability=wrestlerAbility(s);
  if(!ability)return null;
  const firstRound=isRoundEffectActive(s);
  if(ability==="speedPlus"&&stat==="Vitesse")return "+2 Vitesse";
  if(ability==="firstRoundSpeed2"&&firstRound&&stat==="Vitesse")return "+2 Vitesse";
  if(ability==="firstRoundSpeed3"&&firstRound&&stat==="Vitesse")return "+3 Vitesse";
  if(ability==="firstRoundSpeedTechnique1"&&firstRound&&(stat==="Vitesse"||stat==="Technique"))return `+1 ${stat}`;
  if(ability==="firstRoundSpeedTechnique2"&&firstRound&&(stat==="Vitesse"||stat==="Technique"))return `+2 ${stat}`;
  if(ability==="firstRoundForceTechnique"&&firstRound&&(stat==="Force"||stat==="Technique"))return `+1 ${stat}`;
  if(ability==="firstRoundForceTechnique2"&&firstRound&&(stat==="Force"||stat==="Technique"))return `+2 ${stat}`;
  if(ability==="firstRoundForceSpeed1"&&firstRound&&(stat==="Force"||stat==="Vitesse"))return `+1 ${stat}`;
  if(ability==="firstRoundForceSpeed2"&&firstRound&&(stat==="Force"||stat==="Vitesse"))return `+2 ${stat}`;
  if(ability==="firstRoundCharTech"&&firstRound&&(stat==="Charisme"||stat==="Technique"))return `+1 ${stat}`;
  if(ability==="firstRoundCharTech2"&&firstRound&&(stat==="Charisme"||stat==="Technique"))return `+2 ${stat}`;
  if(ability==="firstRoundForceCharTech"&&firstRound&&(stat==="Force"||stat==="Charisme"||stat==="Technique"))return `+1 ${stat}`;
  if(ability==="firstRoundSpeedCharisma3"&&firstRound&&(stat==="Vitesse"||stat==="Charisme"))return `+3 ${stat}`;
  if(ability==="techniqueRound1"&&firstRound&&stat==="Technique")return "+3 Technique";
  if(ability==="managerOwnedTechForceSpeed1"&&s.owner?.man&&(stat==="Technique"||stat==="Force"||stat==="Vitesse"))return `Bonus +1 ${stat}`;
  if(ability==="managerOwnedForceSpeed1"&&s.owner?.man&&(stat==="Force"||stat==="Vitesse"))return `Bonus +1 ${stat}`;
  if(ability==="round2ActiveStat3"&&G.round===2)return `Round 2 +3 ${stat}`;
  if(ability==="round4All1"&&G.round===4)return `Round 4 +1 ${stat}`;
  if(ability==="secondPlayerForceCharisma1"&&s.owner?.side&&G.roundStarter&&s.owner.side!==G.roundStarter&&(stat==="Force"||stat==="Charisme"))return `Second +1 ${stat}`;
  if(ability==="secondPlayerTechnique2"&&s.owner?.side&&G.roundStarter&&s.owner.side!==G.roundStarter&&stat==="Technique")return "Second +2 Technique";
  if(ability==="secondPlayerTechniqueCharisma2"&&s.owner?.side&&G.roundStarter&&s.owner.side!==G.roundStarter&&(stat==="Technique"||stat==="Charisme"))return `Second +2 ${stat}`;
  if(ability==="forcePlus"&&!s.forcePlusUsed&&stat==="Force")return "+2 Force";
  if(ability==="charismaPlus"&&stat==="Charisme")return "+1 Charisme";
  return null;
}

function duel(){
  const stat=G.stat;
  const ps=score(G.player.cat,stat),as=score(G.ai.cat,stat);
  log(`<b>${stat}</b> : ${ps} / ${as}.`);

  const playerStatFx=statAbilityFeedback(G.player.cat,stat);
  const aiStatFx=statAbilityFeedback(G.ai.cat,stat);
  if(playerStatFx){
    log(`[EFFET] ${G.player.cat.card.name} : ${playerStatFx}.`);
    showEffectFeedback(G.player.cat.card,G.player.cat.card.name,playerStatFx,"buff");
  }
  if(aiStatFx){
    log(`[EFFET] ${G.ai.cat.card.name} : ${aiStatFx}.`);
    showEffectFeedback(G.ai.cat.card,G.ai.cat.card.name,aiStatFx,"buff");
  }
  if(stat==="Force"){
    if(wrestlerAbility(G.player.cat)==="forcePlus"&&!G.player.cat.forcePlusUsed)G.player.cat.forcePlusUsed=true;
    if(wrestlerAbility(G.ai.cat)==="forcePlus"&&!G.ai.cat.forcePlusUsed)G.ai.cat.forcePlusUsed=true;
  }

  if(ps===as){
    if(wrestlerAbility(G.player.cat)==="winsTie"&&wrestlerAbility(G.ai.cat)!=="winsTie")return win(G.player,G.ai,"égalité");
    if(wrestlerAbility(G.ai.cat)==="winsTie"&&wrestlerAbility(G.player.cat)!=="winsTie")return win(G.ai,G.player,"égalité");
    log("Égalité.");
    consumeRoundObjects();
    setTimeout(startRound,800);
    return;
  }
  if(G.mode==="challenge"&&G.challenge){
    if(ps>as)return challengePlayerWinsRound(ps-as,stat);
    return challengeBossWinsRound();
  }
  ps>as?win(G.player,G.ai,"score supérieur"):win(G.ai,G.player,"score supérieur");
}

const REPEATABLE_EXTENDED_OBJECT_ABILITIES=new Set(["drawNext1","recoverGrave","opponentDiscard1"]);

function reactivateExtendedObjects(afterDraw){
  [G.player,G.ai].forEach(p=>{
    const object=p.obj;
    if(!object||!REPEATABLE_EXTENDED_OBJECT_ABILITIES.has(object.ability))return;
    if(p.objTurnsRemaining<=0||p.objLastActivationRound===G.round)return;
    const isDrawBonus=object.ability==="drawNext1";
    if(isDrawBonus!==afterDraw)return;
    p.objLastActivationRound=G.round;
    if(isDrawBonus)p.objExtraDrawQueued=true;
    const opponent=p.side==="player"?G.ai:G.player;
    applyTrackedObjectEffect(p,opponent,object);
    log(`[EFFET] ${object.name} se réactive pour son tour supplémentaire.`);
  });
}

function consumeRoundObjects(){
  [G.player,G.ai].forEach(p=>{
    if(p.obj){
      p.objTurnsRemaining=Number.isFinite(p.objTurnsRemaining)?p.objTurnsRemaining:1;
      p.objTurnsRemaining-=1;
      if(p.objTurnsRemaining<=0){
        log(`${p.obj.name} quitte le terrain : ses bonus s'arrêtent.`);
        revertActiveObject(p,true,Boolean(p.objExtraDrawQueued));
      }else{
        log(`${p.obj.name} reste actif (${p.objTurnsRemaining} tour${p.objTurnsRemaining>1?"s":""}).`);
      }
    }
  });
  markOnlineDirty();
}

function clearWrestler(p){
  const lost=p.cat;
  if(!lost)return;
  const lostAbility=wrestlerAbility(lost);
  const speedBonusOnNext={nextSpeedOnFirstLoss1:1,nextSpeedOnFirstLoss2:2}[lostAbility]||0;
  if(speedBonusOnNext&&isFirstRoundForWrestler(lost)){
    p.nextEntryMods={...(p.nextEntryMods||{}),Vitesse:Math.max(Number(p.nextEntryMods?.Vitesse||0),speedBonusOnNext)};
    log(`${lost.card.name} prepare le prochain catcheur : +${speedBonusOnNext} en Vitesse sur son arrivee.`);
    showEffectFeedback(lost.card,lost.card.name,`Prochain +${speedBonusOnNext} Vitesse`,"buff");
  }

  if(lost.save){
    p.hand.push(lost.card);
    log(`${p.label} récupère son catcheur.`);
    showEffectFeedback(lost.card,lost.card.name,"Sauvé du vestiaire","block");
  }else if(lostAbility==="bossSecondWind"&&!lost.bossSecondWindUsed){
    lost.bossSecondWindUsed=true;
    lost.mods.Force+=3;
    lost.mods.Vitesse+=3;
    p.cat=lost;
    log(`[EFFET] ${lost.card.name} refuse le vestiaire : retour immédiat avec +3 Force et +3 Vitesse.`);
    showEffectFeedback(lost.card,lost.card.name,"Retour +3 Force / +3 Vitesse","buff",2400);
    if(p.man){
      p.grave.push(p.man);
      p.man=null;
    }
    p.objectDurationBonus=0;
    revertActiveObject(p,true);
    return;
  }else if(lostAbility==="firstLossDeck"&&!lost.card.firstLossDeckUsed){
    lost.card.firstLossDeckUsed=true;
    p.deck.unshift(lost.card);
    shuffle(p.deck);
    log(`${lost.card.name} échappe au vestiaire et retourne dans le deck.`);
    showEffectFeedback(lost.card,lost.card.name,"Retour deck","block");
  }else{
    p.koSuffered++;
    playSound("ko");
    const returnChance={returnChance:0.2,returnChance40:0.4}[lostAbility]||0;
    if(returnChance&&Math.random()<returnChance){
      p.deck.unshift(lost.card);
      shuffle(p.deck);
      log(`${lost.card.name} part au vestiaire puis revient dans le deck.`);
      showEffectFeedback(lost.card,lost.card.name,"Retour deck","block");
    }else{
      p.grave.push(lost.card);
      log(`${lost.card.name} au vestiaire. ${p.label} a maintenant ${p.koSuffered*10}% de danger au tombé.`);
    }
  }

  if(lostAbility==="nextEntryAll1"&&!p.oncePerMatch?.nextEntryAll1){
    p.oncePerMatch=p.oncePerMatch||{};
    p.oncePerMatch.nextEntryAll1=true;
    p.nextEntryMods={Force:1,Vitesse:1,Technique:1,Charisme:1};
    log(`[EFFET] ${lost.card.name} : prochain catcheur +1 partout (une fois par match).`);
    showEffectFeedback(lost.card,lost.card.name,"Prochain +1 partout","buff");
  }else if(lostAbility==="nextEntryAll1"){
    log(`[EFFET] ${lost.card.name} : effet déjà consommé ce match.`);
  }

  if(p.man){
    releaseSupportEffects(p,p.side==="player"?G.ai:G.player);
    p.grave.push(p.man);
    p.man=null;
  }
  p.objectDurationBonus=0;
  revertActiveObject(p,true);

  p.cat=null;
  markOnlineDirty();
}

function win(winner,loser,reason){
  playSound("victoire_duel");
  log(`<b>${winner.label}</b> gagne le duel.`);
  winner.wins++;
  markOnlineDirty();
  const winnerAbility=wrestlerAbility(winner.cat);
  const loserAbility=wrestlerAbility(loser.cat);
  if(winnerAbility==="drawOnWin1"||winnerAbility==="drawOnWin2"){
    const amount=winnerAbility==="drawOnWin2"?2:1;
    const before=winner.hand.length;
    draw(winner,amount);
    const drawn=winner.hand.length-before;
    if(drawn){
      log(`${winner.cat.card.name} fait piocher ${drawn} carte${drawn>1?"s":""}.`);
      showEffectFeedback(winner.cat.card,winner.cat.card.name,`Victoire : pioche +${drawn}`,"special");
    }
  }
  if(winnerAbility==="winSpeedCharisma1"){
    winner.cat.mods.Vitesse+=1;
    winner.cat.mods.Charisme+=1;
    log(`[EFFET] ${winner.cat.card.name} : +1 Vitesse et +1 Charisme.`);
    showEffectFeedback(winner.cat.card,winner.cat.card.name,"+1 Vitesse / +1 Charisme","buff");
  }
  if(winnerAbility==="firstWinAll1"&&!winner.cat.firstWinAll1Used){
    winner.cat.firstWinAll1Used=true;
    addAllStats(winner.cat,1);
    log(`[EFFET] ${winner.cat.card.name} : première victoire, +1 partout.`);
    showEffectFeedback(winner.cat.card,winner.cat.card.name,"Première victoire +1 partout","buff");
  }
  if(winnerAbility==="growForce")winner.cat.mods.Force++;
  const nextEnemyTechniqueMalus={
    winNextEnemyTechniqueMinus2:-2,
    winNextEnemyTechniqueMinus3:-3
  }[winnerAbility]||0;
  if(nextEnemyTechniqueMalus){
    const current=Number(loser.nextEntryMods?.Technique||0);
    loser.nextEntryMods={...(loser.nextEntryMods||{}),Technique:Math.min(current,nextEnemyTechniqueMalus)};
    log(`[EFFET] ${winner.cat.card.name} : prochain catcheur adverse ${nextEnemyTechniqueMalus} Technique.`);
    showEffectFeedback(winner.cat.card,winner.cat.card.name,`${nextEnemyTechniqueMalus} Technique adverse`,"malus");
  }
  const nextEnemySpeedMalus={
    winNextEnemySpeedMinus2:-2,
    winNextEnemySpeedMinus3:-3
  }[winnerAbility]||0;
  if(nextEnemySpeedMalus){
    const current=Number(loser.nextEntryMods?.Vitesse||0);
    loser.nextEntryMods={...(loser.nextEntryMods||{}),Vitesse:Math.min(current,nextEnemySpeedMalus)};
    log(`[EFFET] ${winner.cat.card.name} : prochain catcheur adverse ${nextEnemySpeedMalus} Vitesse.`);
    showEffectFeedback(winner.cat.card,winner.cat.card.name,`${nextEnemySpeedMalus} Vitesse adverse`,"malus");
  }

  const finishWin=()=>{
    if(loserAbility==="lossEnemyTechniqueMinus2"&&winner.cat){
      winner.cat.mods.Technique-=2;
      log(`${loser.cat.card.name} encaisse mais casse la Technique adverse : -2 Technique.`);
      showEffectFeedback(loser.cat.card,loser.cat.card.name,"Technique adverse -2","malus");
    }

    clearWrestler(loser);
    consumeRoundObjects();
    attemptPin(winner,loser);
  };

  if((winnerAbility==="sameStatNext"||winnerAbility==="sameStatNextFixed")&&G.stat){
    const applyChosenStat=stat=>{
      G.lockedStat=stat||G.stat;
      log(`[EFFET] ${winner.cat.card.name} : prochaine statistique verrouillée sur ${G.lockedStat}.`);
      showEffectFeedback(winner.cat.card,winner.cat.card.name,`${G.lockedStat} verrouillée`,"special");
      finishWin();
    };
    if(winnerAbility==="sameStatNextFixed"){
      applyChosenStat(G.stat);
    }else if(winner.side==="player"){
      requestEffectChoice({
        title:winner.cat.card.name,
        text:"Choisis la statistique du prochain duel.",
        choices:STATS.map(stat=>({label:stat,value:stat})),
        onChoose:applyChosenStat
      });
    }else{
      const best=STATS.reduce((bestStat,stat)=>score(winner.cat,stat)>score(winner.cat,bestStat)?stat:bestStat,STATS[0]);
      applyChosenStat(best);
    }
    return;
  }

  finishWin();
}

function attemptPin(p,target){
  markOnlineDirty();
  fadeMusic("tension",500);
  const base=(target?.koSuffered||0)*10;
  const koCount=Number(target?.koSuffered||0);
  const ability=wrestlerAbility(p.cat);
  const abilityBonus=
    ability==="pinBonus"&&koCount>=2?20:
    ability==="pinBonus40"&&koCount>=2?40:
    0;
  const bonus=(p.cat?.pin||0)+abilityBonus;
  const shield=target?.pinShield||0;
  if(target)target.pinShield=0;
  const chance=Math.max(0,Math.min(100,base+bonus-shield));
  const roll=Math.floor(Math.random()*100)+1;
  log(`Tombe : ${chance}% (${base}% danger adverse + ${bonus}% bonus - ${shield}% protection) - ${roll}.`);
  if(abilityBonus)showEffectFeedback(p.cat.card,p.cat.card.name,`Tombé +${abilityBonus}`,"pin");
  if(shield&&target?.cat?.card)showEffectFeedback(target.cat.card,target.cat.card.name,`Protection -${shield}`,"block");
  showPin(p.label,roll<=chance,chance,roll,p.side);
}

function updateTagButton(){
  const btn=document.getElementById("tagButton");
  if(!btn||!G?.player)return;
  const remaining=Number.isFinite(G.player.tagsRemaining)?G.player.tagsRemaining:TAGS_PER_MATCH;
  btn.innerHTML=`Tag <span id="tagCount">${remaining}/${TAGS_PER_MATCH}</span>`;
  btn.disabled=!canTagPlayer();
  btn.classList.toggle("tag-pending",G.tagging==="player");
  if(G.tagging==="player"){
    btn.innerHTML=`Choisis <span id="tagCount">${remaining}/${TAGS_PER_MATCH}</span>`;
  }
}

function render(){
  document.getElementById("game")?.classList.toggle("allstar-match",G?.mode==="challenge");
  renderChallengeMatchHud();
  updateTagButton();
  document.getElementById("roundNum").textContent=G.round||1;
  const turnLabel=G.discarding==="player"
    ?"DEFAUSSE"
    :G.mode==="online"
      ?(G.currentTurn==="player"?"A VOUS":"ADVERSAIRE")
      :G.currentTurn==="player"?"TOUR JOUEUR":G.currentTurn==="ai"?"TOUR IA":"MAIN EVENT";
  const roundBox=document.querySelector(".round-box");
  const statDisplay=document.getElementById("statDisplay");
  if(roundBox){
    roundBox.classList.toggle("online-own-turn",G.mode==="online"&&G.currentTurn==="player"&&!G.over);
    roundBox.classList.toggle("online-opponent-turn",G.mode==="online"&&G.currentTurn==="ai"&&!G.over);
  }
  if(statDisplay)statDisplay.textContent=G.stat?G.stat.toUpperCase():turnLabel;

  document.getElementById("enemyDeck").textContent=G.ai.deck.length;
  document.getElementById("enemyGrave").textContent=G.ai.grave.length;
  document.getElementById("playerDeck").textContent=G.player.deck.length;
  document.getElementById("playerGrave").textContent=G.player.grave.length;

  document.getElementById("enemyHand").innerHTML=Array.from({length:G.ai.hand.length}).map(()=>`<div class="card-back"></div>`).join("");
  const playerHand=document.getElementById("playerHand");
  playerHand.classList.toggle("discarding",G.discarding==="player");
  playerHand.innerHTML=G.player.hand.map((c,i)=>{
    const click=G.discarding==="player" ? `discardPlayerCard(${i})` : `playPlayer(${i})`;
    return cardHTML(c,`onclick="${click}" onmouseenter="previewCard('${c.id}')"`,c.id);
  }).join("");

  setZone("playerCat",G.player.cat?.card,"CATCHEUR");
  setZone("playerMan",G.player.man,"BONUS");
  setZone("playerObj",G.player.obj,"OBJET");
  setZone("enemyCat",G.ai.cat?.card,"CATCHEUR");
  setZone("enemyMan",G.ai.man,"BONUS");
  setZone("enemyObj",G.ai.obj,"OBJET");
  queueOnlineSnapshotPublish();
}

function setZone(id,c,label){document.getElementById(id).innerHTML=c?cardHTML(c,`onmouseenter="previewCard('${c.id}')"`,c.id):`<div class="slot-empty">${label}</div>`}

function findCardById(id){
  const pools=[G.player.hand,G.ai.hand,G.player.grave,G.ai.grave];
  for(const p of pools){const f=p.find(c=>c.id===id);if(f)return f}
  for(const side of [G.player,G.ai]){
    for(const k of["cat","man","obj"]){
      const item=side[k];
      const card=item?.card||item;
      if(card?.id===id)return card;
    }
  }
  return null;
}

function findCardStateById(id){
  if(!G)return null;
  for(const owner of [G.player,G.ai]){
    if(owner.cat?.card?.id===id)return {owner,state:owner.cat};
  }
  return null;
}

function previewEffectStrip(c){
  const found=findCardStateById(c.id);
  if(!found)return "";
  const {owner,state:s}=found;
  const parts=[];

  STATS.forEach(stat=>{
    const value=Number(s.mods?.[stat]||0);
    if(value)parts.push(`${value>0?"+":""}${value} ${stat}`);
  });

  if(s.save)parts.push("Sauvetage");
  if(owner.pinShield)parts.push(`Protection -${owner.pinShield}`);
  if(owner.obj&&owner.objTurnsRemaining>1)parts.push(`Objet ${owner.objTurnsRemaining} tours`);
  const ability=wrestlerAbility(s);
  if(ability==="pinBonus")parts.push("Tombé +20");
  if((ability==="sameStatNext"||ability==="sameStatNextFixed")&&G.lockedStat)parts.push(`${G.lockedStat} verrouillée`);
  const openingEffect=openingRoundEffectLabel(s);
  if(openingEffect){
    const timing=isMatchRoundOneAbility(ability)?"Round 1":"Premier round";
    parts.push(`${timing} : ${openingEffect}`);
  }

  if(!parts.length)return "";
  return `<div class="preview-effect-strip"><span>Actif</span><b>${parts.join(" · ")}</b></div>`;
}

function previewCard(id){
  const c=findCardById(id);
  if(!c)return;
  document.getElementById("preview").innerHTML=`<div class="preview-title">Carte survolée</div>${cardHTML(c,"",c.id)}${previewEffectStrip(c)}`;
}

function showPileViewer(side="player"){
  if(!G)return;
  const player=side==="ai" ? G.ai : G.player;
  const cards=player?.grave || [];
  const overlay=document.getElementById("pileViewerOverlay");
  const title=document.getElementById("pileViewerTitle");
  const count=document.getElementById("pileViewerCount");
  const grid=document.getElementById("pileViewerGrid");
  if(!overlay || !title || !count || !grid)return;
  title.textContent=side==="ai" ? "Vestiaire adverse" : "Vestiaire joueur";
  count.textContent=cards.length+" carte"+(cards.length>1?"s":"");
  grid.innerHTML=cards.length
    ? cards.map(c=>`<div class="pile-viewer-card" onmouseenter="previewCard('${escapeAttr(c.id)}')">${cardHTML(c,"",c.id)}</div>`).join("")
    : `<div class="pile-viewer-empty">Aucune carte au vestiaire.</div>`;
  overlay.classList.add("active");
}

function closePileViewer(){
  document.getElementById("pileViewerOverlay")?.classList.remove("active");
}

function cardHTML(c,attrs="",id=""){
  const effectOverlay=effectOverlayHTML(c);
  if(c.renderArt){
    return `<div class="game-card rendered ${String(c.type||"").toLowerCase()} ${String(c.rarity||"").toLowerCase()}" ${attrs}>
      <img class="full-card-art" src="${c.renderArt}" alt="${c.name}" onerror="this.closest('.game-card')?.classList.add('render-fallback');this.remove()">
      <div class="render-card-fallback">
        <b>${c.name}</b>
        <span>${displayCardType(c.type)} - ${c.rarity||"Standard"}</span>
      </div>
      ${effectOverlay}
    </div>`;
  }
  const cls=c.type.toLowerCase();
  const stats=c.stats?`<div class="card-stats"><span>FOR ${c.stats.Force}</span><span>VIT ${c.stats.Vitesse}</span><span>TEC ${c.stats.Technique}</span><span>CHA ${c.stats.Charisme}</span></div>`:"";
  const art=c.art?`<img src="${c.art}" alt="">`:"";
  return `<div class="game-card ${cls} ${String(c.rarity||"").toLowerCase()}" ${attrs}><div class="card-type">${displayCardType(c.type)}</div><div class="card-art ${c.art?"has-photo":""}">${art}</div><div class="card-name">${c.name}</div>${stats}<div class="card-effect">${displayEffectText(c.effect)}</div><div class="card-star">★</div>${effectOverlay}</div>`;
}

function escapeRegExp(value){
  return String(value).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
}

function uppercaseJournalCardNames(txt){
  const names=[...new Set(CARD_DATA.map(card=>card.name).filter(Boolean))]
    .sort((a,b)=>b.length-a.length);
  let out=String(txt);
  for(const name of names){
    const pattern=new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRegExp(name)})(?=$|[^\\p{L}\\p{N}])`,"giu");
    out=out.replace(pattern,(match,prefix,found)=>`${prefix}${found.toLocaleUpperCase("fr-FR")}`);
  }
  return out;
}

function log(txt){
  const l=document.getElementById("log");
  l.innerHTML+=`<p>${uppercaseJournalCardNames(txt)}</p>`;
  l.scrollTop=l.scrollHeight;
}

function showRound(){
  const ov=document.getElementById("roundOverlay");
  document.getElementById("roundText").textContent="ROUND "+G.round;
  ov.classList.add("active");
  setTimeout(()=>ov.classList.remove("active"),850);
}

function rollRoundStat(){
  const techniqueSource=[G.player,G.ai].map(p=>p.cat).find(s=>s&&wrestlerAbility(s)==="techniqueWheel75");
  if(techniqueSource&&Math.random()<.75){
    log(`[EFFET] ${techniqueSource.card.name} influence la roulette : Technique.`);
    showEffectFeedback(techniqueSource.card,techniqueSource.card.name,"Roulette : Technique","special",2200);
    return "Technique";
  }
  const speedWeights={speedWheel25:.25,speedWheel50:.5};
  const active=[G.player,G.ai]
    .map(p=>p.cat)
    .filter(s=>s&&isFirstRoundForWrestler(s)&&speedWeights[wrestlerAbility(s)]);
  const best=active.sort((a,b)=>speedWeights[wrestlerAbility(b)]-speedWeights[wrestlerAbility(a)])[0];
  if(best&&Math.random()<speedWeights[wrestlerAbility(best)]){
    log(`[EFFET] ${best.card.name} influence la roulette : Vitesse.`);
    showEffectFeedback(best.card,best.card.name,"Roulette : Vitesse","special",2200);
    return "Vitesse";
  }
  return STATS[Math.floor(Math.random()*4)];
}

function chooseRoundStat(){
  if(G.lockedStat){
    const stat=G.lockedStat;
    G.lockedStat=null;
    return stat;
  }
  return rollRoundStat();
}

function getRoundReroller(){
  return [G.player,G.ai].find(p=>(wrestlerAbility(p.cat)==="rerollStat"||p.man?.ability==="rerollStat")&&!p.rerollUsed);
}

function rerollRoundStatFor(reroller,currentStat){
  const source=reroller.man?.ability==="rerollStat" ? reroller.man : reroller.cat.card;
  reroller.rerollUsed=true;
  const nextStat=rollRoundStat();
  G.stat=nextStat;
  markOnlineDirty();
  log(`[EFFET] ${source.name} : relance la roulette (${currentStat} -> ${nextStat}).`);
  showEffectFeedback(source,source.name,`Roulette : ${currentStat} -> ${nextStat}`,"special",2200);
  return nextStat;
}

function showWheel(cb){
  const ov=document.getElementById("wheelOverlay"),t=document.getElementById("wheelText");
  const splash=ov?.querySelector(".wheel-splash");
  const wheel=ov?.querySelector(".wheel");
  const sub=document.getElementById("wheelSubText");
  const rerollActions=document.getElementById("wheelRerollActions");
  const rerollButton=document.getElementById("wheelRerollButton");
  const keepButton=document.getElementById("wheelKeepButton");
  const statWasLocked=Boolean(G.lockedStat);
  let finalStat=chooseRoundStat();
  const autoReroller=!statWasLocked?[G.player,G.ai].map(p=>p.cat).find(s=>s&&wrestlerAbility(s)==="wheelAutoReroll20"):null;
  if(autoReroller&&Math.random()<.2){
    const previous=finalStat;
    finalStat=rollRoundStat();
    log(`[EFFET] ${autoReroller.card.name} relance automatiquement la roulette (${previous} -> ${finalStat}).`);
    showEffectFeedback(autoReroller.card,autoReroller.card.name,`Roulette : ${previous} -> ${finalStat}`,"special",2200);
  }
  const statAngles={Force:0,Vitesse:270,Technique:180,Charisme:90};
  G.stat=finalStat;
  markOnlineDirty();
  rerollActions?.classList.remove("active");
  if(rerollButton)rerollButton.onclick=null;
  if(keepButton)keepButton.onclick=null;
  splash?.classList.remove("stat-force","stat-vitesse","stat-technique","stat-charisme");
  if(sub)sub.textContent="La stat du duel va tomber.";
  ov?.classList.add("active");
  const resetWheel=()=>{
    if(!wheel)return;
    wheel.classList.remove("spinning","settling");
    wheel.style.animation="none";
    wheel.style.transition="none";
    wheel.style.transform="rotate(0deg)";
    wheel.getBoundingClientRect();
  };
  const closeWheel=()=>{
    ov.classList.remove("active");
    rerollActions?.classList.remove("active");
    if(wheel){
      wheel.classList.remove("spinning","settling");
      wheel.style.animation="";
      wheel.style.transition="";
      wheel.style.transform="";
    }
    cb();
  };
  const spinTo=(targetStat,onDone)=>{
    resetWheel();
    const targetAngle=(10+Math.floor(Math.random()*3))*360+(statAngles[targetStat]||0);
    if(wheel){
      wheel.getBoundingClientRect();
      requestAnimationFrame(()=>{
        wheel.classList.add("spinning");
        wheel.style.transition="transform 1.95s cubic-bezier(.12,.72,.18,1)";
        wheel.style.transform=`rotate(${targetAngle}deg)`;
      });
    }
    render();
    let i=0;
    const spin=setInterval(()=>{
      const stat=STATS[i++%4];
      t.textContent=stat.toUpperCase();
      splash?.classList.remove("stat-force","stat-vitesse","stat-technique","stat-charisme");
      splash?.classList.add(`stat-${stat.toLowerCase()}`);
    },95);
    setTimeout(()=>{
      clearInterval(spin);
      if(wheel){
        wheel.classList.remove("spinning");
        wheel.classList.add("settling");
        wheel.style.transform=`rotate(${targetAngle}deg)`;
      }
    splash?.classList.remove("stat-force","stat-vitesse","stat-technique","stat-charisme");
    splash?.classList.add(`stat-${G.stat.toLowerCase()}`);
    t.textContent=G.stat.toUpperCase()+" !";
    if(sub)sub.textContent=`Duel en ${G.stat}.`;
    render();
      onDone?.();
    },1750);
  };
  const resolveRerollChoice=()=>{
    const reroller=getRoundReroller();
    if(!reroller){
      setTimeout(closeWheel,1250);
      return;
    }
    const source=reroller.man?.ability==="rerollStat" ? reroller.man : reroller.cat.card;
    if(reroller.side==="player"){
      rerollActions?.classList.add("active");
      if(sub)sub.textContent=`${source.name} peut relancer la roulette.`;
      if(rerollButton)rerollButton.onclick=()=>{
        rerollActions?.classList.remove("active");
        const next=rerollRoundStatFor(reroller,G.stat);
        spinTo(next,()=>setTimeout(closeWheel,1050));
      };
      if(keepButton)keepButton.onclick=()=>{
        rerollActions?.classList.remove("active");
        log(`[EFFET] ${source.name} : relance conservée.`);
        setTimeout(closeWheel,550);
      };
      return;
      }
    setTimeout(()=>{
      const next=rerollRoundStatFor(reroller,G.stat);
      spinTo(next,()=>setTimeout(closeWheel,1050));
    },700);
  };
  spinTo(finalStat,resolveRerollChoice);
}

let onlineLastWheelSpinId=null;

function showRemoteWheel(finalStat){
  const ov=document.getElementById("wheelOverlay"),t=document.getElementById("wheelText");
  const splash=ov?.querySelector(".wheel-splash");
  const wheel=ov?.querySelector(".wheel");
  const sub=document.getElementById("wheelSubText");
  const rerollActions=document.getElementById("wheelRerollActions");
  const statAngles={Force:0,Vitesse:270,Technique:180,Charisme:90};
  if(!ov||!t)return;
  rerollActions?.classList.remove("active");
  splash?.classList.remove("stat-force","stat-vitesse","stat-technique","stat-charisme");
  if(sub)sub.textContent="La stat du duel va tomber.";
  ov.classList.add("active");
  if(wheel){
    wheel.classList.remove("spinning","settling");
    wheel.style.animation="none";
    wheel.style.transition="none";
    wheel.style.transform="rotate(0deg)";
    wheel.getBoundingClientRect();
    wheel.style.animation="";
    wheel.style.transition="transform 1.95s cubic-bezier(.12,.72,.18,1)";
    const targetAngle=(10+Math.floor(Math.random()*3))*360+(statAngles[finalStat]||0);
    requestAnimationFrame(()=>{
      wheel.classList.add("spinning");
      wheel.style.transform=`rotate(${targetAngle}deg)`;
    });
  }
  let i=0;
  const spin=setInterval(()=>{
    const stat=STATS[i++%4];
    t.textContent=stat.toUpperCase();
    splash?.classList.remove("stat-force","stat-vitesse","stat-technique","stat-charisme");
    splash?.classList.add(`stat-${stat.toLowerCase()}`);
  },95);
  setTimeout(()=>{
    clearInterval(spin);
    if(wheel)wheel.classList.remove("spinning");
    splash?.classList.remove("stat-force","stat-vitesse","stat-technique","stat-charisme");
    splash?.classList.add(`stat-${String(finalStat).toLowerCase()}`);
    t.textContent=String(finalStat).toUpperCase()+" !";
    if(sub)sub.textContent=`Duel en ${finalStat}.`;
    setTimeout(()=>ov.classList.remove("active"),1250);
  },1750);
}

function showOnlineFinalResult(){
  const ov=document.getElementById("pinOverlay");
  const count=document.getElementById("pinCount");
  const msg=document.getElementById("pinMessage");
  const sub=document.getElementById("pinSub");
  const actions=document.getElementById("pinActions");
  const replayButton=document.getElementById("pinReplayButton");
  const nextButton=document.getElementById("careerNextButton");
  if(!ov||!count||!msg||!sub||!actions)return;
  const playerWon=G.winner==="player";
  ov.classList.add("active");
  count.textContent="3 !";
  msg.textContent=playerWon?"GAGNE !":"PERDU !";
  msg.style.color=playerWon?"#55e879":"#ff5b63";
  sub.textContent=playerWon?"Victoire en ligne.":"Défaite en ligne.";
  if(nextButton){
    nextButton.hidden=true;
    nextButton.disabled=true;
    nextButton.style.display="none";
  }
  if(replayButton){
    replayButton.hidden=true;
    replayButton.disabled=true;
    replayButton.style.display="none";
  }
  actions.classList.add("active");
}

function showPin(name,success,chance,roll,winnerSide=null){
  const ov=document.getElementById("pinOverlay"),count=document.getElementById("pinCount"),msg=document.getElementById("pinMessage"),sub=document.getElementById("pinSub"),actions=document.getElementById("pinActions");
  const nextButton=document.getElementById("careerNextButton");
  const replayButton=document.getElementById("pinReplayButton");
  ov.classList.add("active");
  actions.classList.remove("active");
  if(nextButton){
    nextButton.hidden=true;
    nextButton.disabled=true;
    nextButton.style.display="none";
  }
  if(replayButton){
    replayButton.hidden=false;
    replayButton.disabled=false;
    replayButton.style.display="inline-flex";
  }
  msg.textContent="";
  sub.textContent=`Chance ${chance}% · tirage ${roll}`;

  let steps,final,finalSub;
  if(success){
    steps=chance>=85?["1","2","2,99 !","3 !!!"]:["1","2","3 !"];
    final=`${name} a gagné !`;
    finalSub=chance>=85?"LE PUBLIC EST EN FEU !":"Victoire par tombé !";
  }else{
    if(chance<50){steps=["1"];final="DÉGAGEMENT !";finalSub="Le match continue."}
    else if(chance<85){steps=["1","2"];final="DÉGAGEMENT !";finalSub="Quel match !"}
    else{steps=["1","2","2,99 !"];final="DÉGAGEMENT !";finalSub="La foule explose !"}
  }

  let i=0;
  count.textContent=steps[0];
  playSound("tombe");
  const timer=setInterval(()=>{
    i++;
    if(i<steps.length){
      count.textContent=steps[i];
      playSound("tombe");
    }
    else{
      clearInterval(timer);
      msg.textContent=final;
      sub.textContent=finalSub;
      if(success){
        if(G.mode==="challenge"&&G.challenge){
          handleChallengePinSuccess(winnerSide);
          return;
        }
        G.over=true;
        G.winner=winnerSide||null;
        markOnlineDirty();
        queueOnlineSnapshotPublish();
        const playerWon=winnerSide==="player";
        if(G.mode==="online"){
          settleOnlineMatchRewards();
          fadeMusic(playerWon ? "victoire" : "defaite",900);
          showOnlineFinalResult();
          return;
        }
        awardMatchCredits(playerWon);
        void awardProfileProgress(playerWon);
        if(playerWon&&G.mode==="career"&&Number.isInteger(G.careerIndex)){
          loadPlayerState();
          const opponents=careerOpponents();
          const nextIndex=G.careerIndex+1;
      const lastPlayableIndex=opponents.findLastIndex(opponent=>opponent&&!opponent.missing);
          const nextUnlocked=Math.min(nextIndex,lastPlayableIndex);
          const previousUnlocked=Number(playerState.careerUnlocked)||0;
          playerState.careerUnlocked=Math.max(previousUnlocked,nextUnlocked);
          savePlayerState();
          if(playerState.careerUnlocked>previousUnlocked){
            void pushCloudSaveNow().catch(()=>{});
          }
          renderCareer();
          if(nextButton&&nextIndex<=lastPlayableIndex){
            nextButton.hidden=false;
            nextButton.disabled=false;
            nextButton.style.display="inline-flex";
            sub.textContent=`${finalSub} Nouvel adversaire débloqué.`;
          }
        }
        fadeMusic(playerWon ? "victoire" : "defaite",900);
        actions.classList.add("active");
      }else{
        fadeMusic("match",600);
        setTimeout(()=>{hidePin();startRound()},800);
      }
    }
  },620);
}

function hidePin(){
  document.getElementById("pinOverlay").classList.remove("active");
  document.getElementById("pinActions").classList.remove("active");
}

const PLAYER_STORAGE_KEY = "allstarsPlayerV1";
const BOOSTERS = {
  classic: {
    label: "Pack Classique",
    price: 250,
    size: 5,
    weights: { Standard: 70, Rare: 29, Legende: 1 },
    guarantees: { Rare: 1 }
  },
  premium: {
    label: "Pack Premium",
    price: 500,
    size: 5,
    weights: { Standard: 40, Rare: 55, Legende: 5 },
    guarantees: { Rare: 3 }
  },
  champion: {
    label: "Pack Champion",
    price: 1000,
    size: 5,
    weights: { Standard: 0, Rare: 79.9, Legende: 20, Ultime: 0.1 },
    guarantees: { Legende: 1 }
  }
};

let playerState = {
  credits: 0,
  collection: {},
  boosterTickets: {},
  challenge: null,
  starterGranted: false,
  welcomeClaimed: false,
  careerUnlocked: 0,
  settledOnlineMatches: {},
  savedAt: 0,
  profileProgress: null,
  loaded: false
};

function starterStandardCards(){
  const standards=CARD_DATA.filter(card=>card.rarity==="Standard");
  const standardWrestlers=standards.filter(card=>card.type==="Catcheur");
  return [
    ...standards,
    ...standardWrestlers.slice(0, Math.max(0, 15-standards.length))
  ].slice(0,15).map(cloneCard);
}

function autoDeckFromCollection(){
  const keys=[];
  const perCard={};
  const rarityLimit={Rare:8,Legende:3};
  const rarityCount={Rare:0,Legende:0};
  for(const card of CARD_DATA){
    const key=cardKey(card);
    const owned=ownedCount(key);
    for(let i=0;i<owned;i++){
      if(keys.length>=20)break;
      if((perCard[key]||0)>=2)break;
      if(rarityLimit[card.rarity] && rarityCount[card.rarity]>=rarityLimit[card.rarity])break;
      keys.push(key);
      perCard[key]=(perCard[key]||0)+1;
      if(rarityLimit[card.rarity])rarityCount[card.rarity]++;
    }
  }
  return keys;
}

function loadPlayerState(){
  if(playerState.loaded)return;
  try{
    const saved=JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY)||"null");
    if(saved){
      playerState={
        credits:Number(saved.credits ?? saved["crédits"])||0,
        collection:saved.collection||{},
        boosterTickets:saved.boosterTickets||{},
        challenge:saved.challenge||null,
        starterGranted:Boolean(saved.starterGranted),
        welcomeClaimed:Boolean(saved.welcomeClaimed),
        careerUnlocked:Number(saved.careerUnlocked)||0,
        settledOnlineMatches:saved.settledOnlineMatches||{},
        savedAt:Number(saved.savedAt)||0,
        profileProgress:window.AllstarRankingService.normalizeProgress(saved.profileProgress||{}),
        loaded:true
      };
    }
  }catch{
    // Progression remains playable without localStorage.
  }
  if(!playerState.loaded)playerState={credits:0,collection:{},boosterTickets:{},challenge:null,starterGranted:false,welcomeClaimed:false,careerUnlocked:0,settledOnlineMatches:{},savedAt:0,profileProgress:window.AllstarRankingService.normalizeProgress({}),loaded:true};
  playerState.profileProgress=window.AllstarRankingService.normalizeProgress(playerState.profileProgress||{});
  playerState.boosterTickets=playerState.boosterTickets||{};
  playerState.challenge=playerState.challenge||null;
  playerState.settledOnlineMatches=playerState.settledOnlineMatches||{};
  playerState.savedAt=Number(playerState.savedAt)||0;
  if(!playerState.starterGranted){
    playerState.starterGranted=true;
    playerState.credits=Math.max(playerState.credits,1000);
    addCardsToCollection(starterStandardCards());
  }
  if(!playerState.welcomeClaimed){
    playerState.welcomeClaimed=true;
    const cards=generateBooster("champion");
    ensureBoosterHasWrestler(cards,"Legende");
    capBoosterLegendaries(cards,3);
    addCardsToCollection(cards);
    savePlayerState();
    setTimeout(()=>openBooster(cards,"Pack Champion offert"),450);
  }else{
    savePlayerState();
  }
}

function savePlayerState(){
  playerState.savedAt=Date.now();
  try{
    localStorage.setItem(PLAYER_STORAGE_KEY,JSON.stringify({
      credits:playerState.credits,
      collection:playerState.collection,
      boosterTickets:playerState.boosterTickets||{},
      challenge:playerState.challenge||null,
      starterGranted:playerState.starterGranted,
      welcomeClaimed:playerState.welcomeClaimed,
      careerUnlocked:playerState.careerUnlocked||0,
      settledOnlineMatches:playerState.settledOnlineMatches||{},
      savedAt:playerState.savedAt,
      profileProgress:playerState.profileProgress||{}
    }));
  }catch{
    // Progression is optional in restrictive environments.
  }
  updateCreditDisplays();
  if(document.getElementById("shop")?.classList.contains("active"))renderBoosterTickets();
  queueCloudSave();
}

function updateCreditDisplays(){
  document.querySelectorAll("#creditDisplay,.credit-display").forEach(el=>el.textContent=playerState.credits);
}

function ownedCount(key){return Number(playerState.collection[key]||0)}
function ownedCards(){return CARD_DATA.filter(card=>ownedCount(cardKey(card))>0)}

function addCardsToCollection(cards){
  const newCardKeys=new Set();
  cards.forEach(card=>{
    const key=cardKey(card);
    if(!ownedCount(key))newCardKeys.add(key);
    playerState.collection[key]=(playerState.collection[key]||0)+1;
  });
  return newCardKeys;
}

function rarityPool(rarity){
  return CARD_DATA.filter(card=>card.rarity===rarity);
}

function randomFrom(list){
  return list[Math.floor(Math.random()*list.length)];
}

function weightedRarity(weights){
  const total=Object.values(weights).reduce((sum,value)=>sum+value,0);
  let roll=Math.random()*total;
  for(const [rarity,weight] of Object.entries(weights)){
    roll-=weight;
    if(roll<=0)return rarity;
  }
  return "Standard";
}

function randomCardForBooster(booster, forcedRarity=null){
  const rarity=forcedRarity||weightedRarity(booster.weights);
  const pool=rarityPool(rarity);
  return cloneCard(randomFrom(pool.length?pool:CARD_DATA));
}

function generateBooster(id){
  const booster=BOOSTERS[id];
  const cards=[];
  Object.entries(booster.guarantees).forEach(([rarity,count])=>{
    for(let i=0;i<count;i++)cards.push(randomCardForBooster(booster,rarity));
  });
  while(cards.length<booster.size)cards.push(randomCardForBooster(booster));
  return shuffle(cards).map(card=>({...card,id:Math.random().toString(36).slice(2)}));
}

function ensureBoosterHasWrestler(cards, preferredRarity="Legende"){
  if(cards.some(card=>card.type==="Catcheur"))return cards;
  const pool=CARD_DATA.filter(card=>card.type==="Catcheur"&&card.rarity===preferredRarity);
  cards[0]={...cloneCard(randomFrom(pool.length?pool:CARD_DATA.filter(card=>card.type==="Catcheur"))),id:Math.random().toString(36).slice(2)};
  return cards;
}

function capBoosterLegendaries(cards, maxLegendaries=3){
  let count=0;
  const rarePool=rarityPool("Rare");
  cards.forEach((card,index)=>{
    if(card.rarity!=="Legende")return;
    count++;
    if(count>maxLegendaries){
      cards[index]={...cloneCard(randomFrom(rarePool)),id:Math.random().toString(36).slice(2)};
    }
  });
  return cards;
}

function buyBooster(id){
  loadPlayerState();
  const booster=BOOSTERS[id];
  if(!booster)return;
  if(playerState.credits<booster.price){
    setShopStatus(`Il manque ${booster.price-playerState.credits} crédits pour ouvrir ce booster.`);
    return;
  }
  playerState.credits-=booster.price;
  const cards=generateBooster(id);
  const newCardKeys=addCardsToCollection(cards);
  savePlayerState();
  openBooster(cards,booster.label,newCardKeys);
}

function openTicketBooster(id){
  loadPlayerState();
  const booster=BOOSTERS[id];
  if(!booster)return;
  const count=Number(playerState.boosterTickets?.[id]||0);
  if(count<=0){
    setShopStatus("Aucun pack gagné disponible.");
    return;
  }
  playerState.boosterTickets[id]=count-1;
  const cards=generateBooster(id);
  const newCardKeys=addCardsToCollection(cards);
  savePlayerState();
  openBooster(cards,`${booster.label} gagné`,newCardKeys);
}

function renderBoosterTickets(){
  const grid=document.getElementById("boosterTicketGrid");
  if(!grid)return;
  const tickets=playerState.boosterTickets||{};
  const validEntries=Object.entries(tickets).filter(([id,count])=>Number(count)>0&&BOOSTERS[id]);
  if(!validEntries.length){
    grid.innerHTML="";
    grid.classList.remove("active");
    return;
  }
  grid.classList.add("active");
  grid.innerHTML=validEntries.map(([id,count])=>`
    <button class="booster-ticket ${id}" onclick="openTicketBooster('${escapeAttr(id)}')">
      <span>${BOOSTERS[id].label} gagné</span>
      <b>x${Number(count)}</b>
      <small>Ouvrir sans dépenser de crédits</small>
    </button>
  `).join("");
}

function setShopStatus(message){
  const el=document.getElementById("shopStatus");
  if(el)el.textContent=message;
}

function renderShop(){
  loadPlayerState();
  updateCreditDisplays();
  renderBoosterTickets();
  setShopStatus("");
}

function renderCollection(){
  loadPlayerState();
  const grid=document.getElementById("collectionGrid");
  const summary=document.getElementById("collectionSummary");
  const status=document.getElementById("collectionStatus");
  if(!grid||!summary||!status)return;
  const owned=ownedCards();
  const total=owned.reduce((sum,card)=>sum+ownedCount(cardKey(card)),0);
  summary.innerHTML=`
    <span><b>${owned.length}</b> / ${CARD_DATA.length} cartes uniques</span>
    <span><b>${total}</b> cartes au total</span>
    <span><b>${playerState.credits}</b> crédits</span>
  `;
  status.textContent="";
  grid.innerHTML=owned.map(card=>{
    const count=ownedCount(cardKey(card));
    const safeId=escapeAttr(cardKey(card));
    return `<div class="collection-card ${String(card.rarity||"").toLowerCase()}" onmouseenter="setCollectionPreview('${safeId}')" onclick="setCollectionPreview('${safeId}')">
      ${cardHTML(card,"","")}
      <div class="collection-count">x${count}</div>
    </div>`;
  }).join("");
  setCollectionPreview(owned[0] ? cardKey(owned[0]) : null);
}

function setCollectionPreview(cardOrId){
  const preview=document.getElementById("collectionPreview");
  if(!preview)return;
  const card=typeof cardOrId==="string" ? CARD_DATA.find(item=>cardKey(item)===cardOrId||item.id===cardOrId) : cardOrId;
  preview.innerHTML=card
    ? `<div class="collection-preview-card">${cardHTML(card,"","")}</div>`
    : `<div class="preview-empty">Sélectionne une carte</div>`;
}

function openBooster(cards,title,newCardKeys=new Set()){
  const overlay=document.getElementById("boosterOverlay");
  const cardBox=document.getElementById("boosterCards");
  const actions=document.getElementById("boosterActions");
  if(!overlay||!cardBox||!actions)return;
  document.getElementById("boosterTitle").textContent=title;
  document.getElementById("boosterSub").textContent="Ouverture du booster...";
  cardBox.innerHTML="";
  actions.classList.remove("active");
  overlay.classList.add("active");
  playSound("pioche");
  cards.forEach((card,index)=>{
    setTimeout(()=>{
      const slot=document.createElement("div");
      slot.className=`booster-reveal ${String(card.rarity||"").toLowerCase()}`;
      slot.innerHTML=cardHTML(card,"","");
      if(newCardKeys.has(cardKey(card))){
        const badge=document.createElement("span");
        badge.className="booster-new-label";
        badge.textContent="Nouveau";
        slot.appendChild(badge);
      }
      cardBox.appendChild(slot);
      document.getElementById("boosterSub").textContent=`${card.rarity} - ${card.name}`;
      playSound((card.rarity==="Legende"||card.rarity==="Ultime")?"victoire_duel":"carte_jouee");
      if(card.rarity==="Legende"||card.rarity==="Ultime")playThemeForCard(card);
      if(index===cards.length-1){
        setTimeout(()=>actions.classList.add("active"),450);
      }
    },650*(index+1));
  });
  renderShop();
  renderCollection();
}

function closeBooster(){
  document.getElementById("boosterOverlay")?.classList.remove("active");
  document.getElementById("boosterActions")?.classList.remove("active");
  renderShop();
  renderCollection();
}

function playThemeForCard(card){
  const musicLibrary=window.AUDIO_LIBRARY?.music || {};
  if(card?.musicId && musicLibrary[card.musicId]){
    sound()?.playMusic(card.musicId);
    return;
  }
  const normalizeThemeName=value=>String(value||"")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .replace(/['’]/g,"")
    .replace(/[^a-z0-9]+/g,"_")
    .replace(/^_|_$/g,"");
  const target=normalizeThemeName(card.name);
  const entry=Object.entries(window.AUDIO_LIBRARY?.music||{}).find(([,music])=>normalizeThemeName(music.wrestler)===target);
  if(entry)sound()?.playMusic(entry[0]);
}

function awardMatchCredits(playerWon){
  loadPlayerState();
  const gain=playerWon?100:50;
  playerState.credits+=gain;
  savePlayerState();
  log(`<b>${gain} crédits gagnés.</b> Total : ${playerState.credits}.`);
}

function onlineMatchSettlementId(){
  const ctx=onlineContext();
  return G?.matchOptions?.onlineMatchId||`${ctx.roomCode||"room"}:legacy:${G?.round||0}`;
}

function settleOnlineMatchRewards(){
  if(!isOnlineMatch()||!G?.over||!G?.winner)return false;
  loadPlayerState();
  const matchId=onlineMatchSettlementId();
  playerState.settledOnlineMatches=playerState.settledOnlineMatches||{};
  if(playerState.settledOnlineMatches[matchId])return false;
  playerState.settledOnlineMatches[matchId]=Date.now();
  playerState.settledOnlineMatches=Object.fromEntries(
    Object.entries(playerState.settledOnlineMatches)
      .sort(([,a],[,b])=>Number(b)-Number(a))
      .slice(0,100)
  );
  const playerWon=G.winner==="player";
  awardMatchCredits(playerWon);
  void awardProfileProgress(playerWon);
  return true;
}

function profileXpGainForMatch(playerWon, progress){
  const mode=G?.mode||"duel";
  if(mode==="multiplayer"||mode==="online"||mode==="ranked"){
    return playerWon ? 100 : 50;
  }
  if(mode==="career"&&playerWon&&Number.isInteger(G?.careerIndex)){
    const opponent=careerOpponents()[G.careerIndex];
    const key=`career_${G.careerIndex}_${opponent?.name||"adversaire"}`;
    if(!progress.careerXpWins?.[key]){
      const rewards=[100,200,300,400];
      return rewards[Math.max(0,Math.min(3,Number(opponent?.season)||0))]||100;
    }
  }
  return playerWon ? 50 : 25;
}

function markCareerXpWin(progress){
  if(G?.mode!=="career"||!Number.isInteger(G?.careerIndex))return progress;
  const opponent=careerOpponents()[G.careerIndex];
  const key=`career_${G.careerIndex}_${opponent?.name||"adversaire"}`;
  progress.careerXpWins={...(progress.careerXpWins||{}),[key]:true};
  return progress;
}

async function awardProfileProgress(playerWon){
  loadPlayerState();
  let user=null;
  let baseProfile=playerState.profileProgress||{};
  try{
    user=await window.AllstarAuthService?.getCurrentUser?.();
    if(user){
      profileUiState.user=user;
      baseProfile=await window.AllstarProfileService.ensureUserProfile(user);
    }
  }catch{
    user=null;
  }
  let progress=window.AllstarRankingService.normalizeProgress(baseProfile);
  const gain=profileXpGainForMatch(playerWon,progress);
  progress=window.AllstarRankingService.addXp(progress,gain);
  progress[playerWon?"wins":"losses"]+=1;
  progress.currentStreak=playerWon ? Math.max(1,progress.currentStreak+1) : Math.min(-1,progress.currentStreak-1);
  progress.bestStreak=Math.max(progress.bestStreak,Math.max(0,progress.currentStreak));
  if(playerWon)progress=markCareerXpWin(progress);
  if(G?.mode==="ranked"||G?.matchOptions?.ranked){
    progress=await window.AllstarRankingService.updateEloAfterMatch(progress,{won:playerWon,opponentElo:Number(G?.matchOptions?.opponentElo||1000)});
  }
  playerState.profileProgress=progress;
  savePlayerState();
  log(`<b>+${gain} XP</b> Niveau ${progress.level} (${progress.xp}/${window.AllstarRankingService.xpForNextLevel(progress.level)}).`);
  if(user){
    try{
      profileUiState.profile=await window.AllstarProfileService.updateUserProfile(user.uid,progress);
    }catch(error){
      log(`<b>[PROFIL]</b> Sauvegarde cloud indisponible, progression conservée en local.`);
    }
  }
}

const CHALLENGE_LIFE_RECOVERY_MS = 24*60*60*1000;
const CHALLENGE_HP_BY_RARITY = { Standard:10, Rare:20, Legende:50, Ultime:100 };

function challengeLifeRecoveryText(state){
  const remaining=Math.max(0,(Number(state?.livesRefreshAt)||0)-Date.now());
  if(!remaining)return "maintenant";
  const totalMinutes=Math.ceil(remaining/60000);
  const hours=Math.floor(totalMinutes/60);
  const minutes=totalMinutes%60;
  if(hours>0)return `${hours}h${minutes?` ${minutes}min`:""}`;
  return `${minutes}min`;
}

function challengeWeekKey(date=new Date()){
  const start=new Date(date.getFullYear(),0,1);
  const dayMs=24*60*60*1000;
  const week=Math.floor((date-start)/dayMs/7)+1;
  return `${date.getFullYear()}-W${String(week).padStart(2,"0")}`;
}

function hashString(value){
  let hash=2166136261;
  for(const char of String(value)){
    hash^=char.charCodeAt(0);
    hash=Math.imul(hash,16777619);
  }
  return hash>>>0;
}

function weeklyChallengeBoss(){
  const weekKey=challengeWeekKey();
  const pool=CARD_DATA
    .filter(card=>card.type==="Catcheur"&&CHALLENGE_HP_BY_RARITY[card.rarity])
    .sort((a,b)=>rarityRank(a.rarity)-rarityRank(b.rarity)||String(a.name).localeCompare(String(b.name))||cardKey(a).localeCompare(cardKey(b)));
  const boss=pool[hashString(`ALLSTAR-${weekKey}`)%Math.max(1,pool.length)]||CARD_DATA.find(card=>card.type==="Catcheur");
  return {weekKey,boss,bossKey:boss?cardKey(boss):null};
}

function challengeRewardTickets(rarity){
  if(rarity==="Standard")return {classic:5};
  if(rarity==="Rare")return {premium:5};
  if(rarity==="Legende")return {champion:5};
  if(rarity==="Ultime")return {champion:10};
  return {classic:5};
}

function challengeRewardLabel(rarity){
  const tickets=challengeRewardTickets(rarity);
  return Object.entries(tickets)
    .map(([id,count])=>`${count} ${BOOSTERS[id]?.label||"Pack"}${count>1?"s":""}`)
    .join(" + ");
}

function ensureAllstarChallengeState(){
  loadPlayerState();
  const weekly=weeklyChallengeBoss();
  const boss=weekly.boss;
  const maxHp=CHALLENGE_HP_BY_RARITY[boss?.rarity]||10;
  const current=playerState.challenge;
  if(!current||current.weekKey!==weekly.weekKey||current.bossKey!==weekly.bossKey){
    playerState.challenge={
      weekKey:weekly.weekKey,
      bossKey:weekly.bossKey,
      bossHp:maxHp,
      maxHp,
      lives:3,
      livesRefreshAt:0,
      completed:false,
      rewardClaimed:false
    };
    savePlayerState();
    return playerState.challenge;
  }
  current.maxHp=Number(current.maxHp)||maxHp;
  current.bossHp=Math.max(0,Math.min(current.maxHp,Number(current.bossHp ?? current.maxHp)));
  current.lives=Math.max(0,Math.min(3,Number(current.lives ?? 3)));
  current.livesRefreshAt=Number(current.livesRefreshAt)||0;
  if(current.lives<=0&&current.livesRefreshAt&&Date.now()>=current.livesRefreshAt&&!current.completed){
    current.lives=3;
    current.livesRefreshAt=0;
    savePlayerState();
  }
  return current;
}

function currentChallengeBossCard(){
  const state=ensureAllstarChallengeState();
  return cardByKey(state.bossKey)||weeklyChallengeBoss().boss;
}

function challengeMatchPayload(state=ensureAllstarChallengeState()){
  const boss=cardByKey(state.bossKey)||weeklyChallengeBoss().boss;
  return {
    weekKey:state.weekKey,
    bossKey:state.bossKey,
    bossName:boss?.name||"Boss ALLSTAR",
    rarity:boss?.rarity||"Standard",
    hp:Number(state.bossHp)||0,
    maxHp:Number(state.maxHp)||CHALLENGE_HP_BY_RARITY[boss?.rarity]||10,
    lives:Number(state.lives)||0
  };
}

function grantBoosterTickets(tickets){
  loadPlayerState();
  playerState.boosterTickets=playerState.boosterTickets||{};
  Object.entries(tickets||{}).forEach(([id,count])=>{
    playerState.boosterTickets[id]=(Number(playerState.boosterTickets[id])||0)+Number(count||0);
  });
  savePlayerState();
}

function setupChallengeBossOnRing(){
  if(!G?.challenge?.bossKey)return;
  const bossCard=cardByKey(G.challenge.bossKey);
  if(!bossCard)return;
  const boss=cloneCard(bossCard);
  G.ai.cat=state(boss);
  G.ai.cat.owner=G.ai;
  const index=G.ai.deck.findIndex(card=>cardKey(card)===G.challenge.bossKey);
  if(index>=0)G.ai.deck.splice(index,1);
}

function updateSavedChallengeFromMatch(){
  if(!G?.challenge)return;
  const state=ensureAllstarChallengeState();
  if(state.weekKey!==G.challenge.weekKey||state.bossKey!==G.challenge.bossKey)return;
  state.bossHp=Math.max(0,Number(G.challenge.hp)||0);
  state.lives=Math.max(0,Number(G.challenge.lives)||0);
  savePlayerState();
}

function renderChallengeMatchHud(){
  const hud=document.getElementById("challengeMatchHud");
  if(!hud)return;
  if(!G||G.mode!=="challenge"||!G.challenge){
    hud.hidden=true;
    return;
  }
  hud.hidden=false;
  const hp=Math.max(0,Number(G.challenge.hp)||0);
  const maxHp=Math.max(1,Number(G.challenge.maxHp)||1);
  const pct=Math.max(0,Math.min(100,(hp/maxHp)*100));
  const name=document.getElementById("challengeHudName");
  const hpText=document.getElementById("challengeHudHp");
  const lives=document.getElementById("challengeHudLives");
  const fill=document.getElementById("challengeHpFill");
  if(name)name.textContent=G.challenge.bossName||"Boss";
  if(hpText)hpText.textContent=`PV ${hp} / ${maxHp}`;
  if(lives)lives.textContent=`Vies ${Number(G.challenge.lives)||0}`;
  if(fill)fill.style.width=`${pct}%`;
}

function showChallengeResult(title,detail,won=false){
  const ov=document.getElementById("pinOverlay");
  const count=document.getElementById("pinCount");
  const msg=document.getElementById("pinMessage");
  const sub=document.getElementById("pinSub");
  const actions=document.getElementById("pinActions");
  const nextButton=document.getElementById("careerNextButton");
  ov?.classList.add("active");
  if(count)count.textContent=won?"KO !":"0";
  if(msg)msg.textContent=title;
  if(sub)sub.textContent=detail;
  if(nextButton){
    nextButton.hidden=true;
    nextButton.disabled=true;
    nextButton.style.display="none";
  }
  actions?.classList.add("active");
}

function challengePlayerWinsRound(damage,stat){
  const dealt=Math.max(1,Number(damage)||1);
  G.challenge.hp=Math.max(0,(Number(G.challenge.hp)||0)-dealt);
  playSound("victoire_duel");
  log(`[DÉFI] ${G.player.cat.card.name} blesse ${G.challenge.bossName} : -${dealt} PV en ${stat}.`);
  showEffectFeedback(G.player.cat.card,"Défi ALLSTAR",`-${dealt} PV boss`,"pin",2200);
  consumeRoundObjects();
  updateSavedChallengeFromMatch();
  render();
  if(G.challenge.hp<=0){
    completeAllstarChallenge();
    return;
  }
  setTimeout(startRound,900);
}

function challengeBossWinsRound(){
  log(`[DÉFI] ${G.challenge.bossName} gagne le round : tentative de tombé.`);
  clearWrestler(G.player);
  consumeRoundObjects();
  attemptPin(G.ai,G.player);
}

function handleChallengePinSuccess(winnerSide){
  if(!G?.challenge)return;
  if(winnerSide==="player"){
    completeAllstarChallenge();
    return;
  }
  G.challenge.lives=Math.max(0,(Number(G.challenge.lives)||0)-1);
  updateSavedChallengeFromMatch();
  render();
  if(G.challenge.lives<=0){
    const state=ensureAllstarChallengeState();
    state.lives=0;
    state.bossHp=Math.max(0,Number(G.challenge.hp)||0);
    state.livesRefreshAt=Date.now()+CHALLENGE_LIFE_RECOVERY_MS;
    savePlayerState();
    G.over=true;
    fadeMusic("defaite",900);
    showChallengeResult("Défi perdu !",`${G.challenge.bossName} garde ${state.bossHp} PV. Vies récupérées dans 24h.`);
    return;
  }
  const msg=document.getElementById("pinMessage");
  const sub=document.getElementById("pinSub");
  if(msg)msg.textContent="Vie perdue !";
  if(sub)sub.textContent=`${G.challenge.lives} vie${G.challenge.lives>1?"s":""} restante${G.challenge.lives>1?"s":""}.`;
  fadeMusic("match",600);
  setTimeout(()=>{hidePin();startRound()},950);
}

function completeAllstarChallenge(){
  const state=ensureAllstarChallengeState();
  if(state.weekKey!==G.challenge.weekKey||state.bossKey!==G.challenge.bossKey)return;
  const boss=cardByKey(state.bossKey)||currentChallengeBossCard();
  const tickets=challengeRewardTickets(boss?.rarity);
  const reward=challengeRewardLabel(boss?.rarity);
  state.bossHp=0;
  state.completed=true;
  if(!state.rewardClaimed){
    grantBoosterTickets(tickets);
    state.rewardClaimed=true;
  }
  savePlayerState();
  G.challenge.hp=0;
  G.over=true;
  fadeMusic("victoire",900);
  log(`[DÉFI] ${G.challenge.bossName} est vaincu. Récompense : ${reward}.`);
  showChallengeResult("Défi réussi !",`Récompense gagnée : ${reward}.`,true);
}

function challengeDeckForBoss(boss){
  const keys=[];
  if(!boss)return makeAiDeckKeys();
  const stats=Object.entries(boss.stats||{})
    .sort((a,b)=>b[1]-a[1])
    .map(([stat])=>stat);
  const entry={
    name:boss.name,
    season:boss.rarity==="Standard"?0:boss.rarity==="Rare"?1:boss.rarity==="Legende"?2:3,
    priorityStats:stats,
    legendSlots:boss.rarity==="Legende"?2:boss.rarity==="Ultime"?3:0,
    ultimateBoss:boss.rarity==="Ultime"
  };
  addCareerKey(keys,boss,boss.rarity==="Ultime"?1:2);
  addCareerPool(keys, careerSupportPool(entry,boss.rarity==="Standard"?"Standard":"Rare"), 8);
  if(boss.rarity==="Legende"||boss.rarity==="Ultime")addCareerPool(keys, careerSupportPool(entry,"Legende"), boss.rarity==="Ultime"?3:2);
  addCareerPool(keys, careerSupportPool(entry,"Standard"), 20);
  return legalDeckKeys(keys);
}

function renderAllstarChallenge(){
  const state=ensureAllstarChallengeState();
  const boss=currentChallengeBossCard();
  const status=document.getElementById("challengeStatus");
  const preview=document.getElementById("challengePreview");
  const week=document.getElementById("challengeWeek");
  const name=document.getElementById("challengeBossName");
  const meta=document.getElementById("challengeBossMeta");
  const hp=document.getElementById("challengeBossHp");
  const reward=document.getElementById("challengeRewardText");
  if(preview)preview.innerHTML=boss?cardHTML(boss,"",""):`<div class="preview-empty">Boss indisponible</div>`;
  if(week)week.textContent=`Semaine ${state.weekKey}`;
  if(name)name.textContent=boss?.name||"Boss ALLSTAR";
  if(meta)meta.textContent=`${boss?.type||"Catcheur"} - ${boss?.rarity||"Standard"}`;
  if(hp)hp.textContent=`${state.bossHp} / ${state.maxHp}`;
  if(reward)reward.textContent=`Récompense : ${challengeRewardLabel(boss?.rarity)}`;
  if(status){
    if(state.completed)status.textContent="Défi remporté cette semaine.";
    else if(state.lives<=0)status.textContent=`Vies épuisées. Le boss garde ${state.bossHp} PV. Retour dans ${challengeLifeRecoveryText(state)}.`;
    else status.textContent=`${state.lives} vie${state.lives>1?"s":""} disponible${state.lives>1?"s":""}.`;
  }
}

function startAllstarChallenge(){
  const state=ensureAllstarChallengeState();
  if(state.completed){
    showSystemToast("Défi déjà remporté cette semaine.");
    renderAllstarChallenge();
    return;
  }
  if(state.lives<=0){
    showSystemToast(`Vies épuisées : retour dans ${challengeLifeRecoveryText(state)}.`);
    renderAllstarChallenge();
    return;
  }
  const boss=currentChallengeBossCard();
  showDeckSelect({
    mode:"challenge",
    returnScreen:"challenge",
    options:{
      mode:"challenge",
      aiLabel:boss?.name||"Boss ALLSTAR",
      aiDeckKeys:challengeDeckForBoss(boss),
      challenge:challengeMatchPayload(state)
    }
  });
}

const CAREER_SEASONS = [
  { name:"Rookie", count:5 },
  { name:"Challenger", count:5 },
  { name:"Elite", count:5 },
  { name:"Champion", count:5 }
];

const CAREER_ROSTER = [
  { name:"Angelo Folena", season:0, difficulty:1, archetype:"force_rookie", priorityStats:["Force","Charisme"], legendSlots:0 },
  { name:"Dorian Garcia", season:0, difficulty:1, archetype:"technique_rookie", priorityStats:["Technique","Vitesse"], legendSlots:0 },
  { name:"Kevin Avanti", season:0, difficulty:2, archetype:"speed_rookie", priorityStats:["Vitesse","Technique"], legendSlots:0 },
  { name:"Max Corleone", season:0, difficulty:2, archetype:"power_rookie", priorityStats:["Force","Charisme"], legendSlots:0 },
  { name:"RUKASU", season:0, difficulty:2, archetype:"balanced_rookie", priorityStats:["Charisme","Force"], legendSlots:0 },

  { name:"Alex Ezio", season:1, difficulty:3, archetype:"technique_control", priorityStats:["Technique","Charisme"], legendSlots:1 },
  { name:"Black Sam", season:1, difficulty:3, archetype:"power_pin", priorityStats:["Force","Charisme"], legendSlots:1 },
  { name:"Car Crash Gonzo", season:1, difficulty:3, archetype:"speed_pressure", priorityStats:["Vitesse","Force"], legendSlots:1 },
  { name:"Ethan Riley", season:1, difficulty:3, archetype:"roulette_control", priorityStats:["Technique","Charisme"], legendSlots:1 },
  { name:"Jaydon Ross", season:1, difficulty:3, archetype:"momentum", priorityStats:["Vitesse","Charisme"], legendSlots:1 },

  { name:"Drix", season:2, difficulty:4, archetype:"technique_elite", priorityStats:["Technique","Force"], legendSlots:2 },
  { name:"Jet Kid", season:2, difficulty:4, archetype:"speed_elite", priorityStats:["Vitesse","Technique"], legendSlots:2 },
  { name:"Kyle Hoxton", season:2, difficulty:4, archetype:"random_growth", priorityStats:["Charisme","Force"], legendSlots:2 },
  { name:"Maxime Cuadrado", season:2, difficulty:4, archetype:"manager_synergy", priorityStats:["Force","Technique"], legendSlots:2 },
  { name:"Zaeken", season:2, difficulty:4, archetype:"control_elite", priorityStats:["Technique","Vitesse"], legendSlots:2 },

  { name:"Big Sam", season:3, difficulty:5, archetype:"champion_power", priorityStats:["Force","Charisme"], legendSlots:3 },
  { name:"Nils'N", season:3, difficulty:5, archetype:"champion_speed", priorityStats:["Vitesse","Technique"], legendSlots:3 },
  { name:"Shawn Olsen", season:3, difficulty:5, archetype:"champion_control", priorityStats:["Technique","Charisme"], legendSlots:3 },
  { name:"Tyson Briggs", season:3, difficulty:5, archetype:"champion_pressure", priorityStats:["Force","Vitesse"], legendSlots:3 },
  { name:"Tom La Ruffa", season:3, difficulty:6, archetype:"ultimate_boss", priorityStats:["Technique","Charisme","Force","Vitesse"], legendSlots:3, ultimateBoss:true }
];

function careerOpponents(){
  return CAREER_ROSTER.map((entry,index)=>{
    const preferred=entry.ultimateBoss ? "Ultime" : entry.legendSlots>0 ? "Legende" : "Rare";
    const card=findCareerWrestlerCard(entry.name, preferred);
    return {...entry,index,card,name:card?.name||entry.name,missing:!card};
  });
}

function cardsByWrestlerName(name){
  return CARD_DATA.filter(card=>card.type==="Catcheur"&&card.name===name);
}

function findCareerWrestlerCard(name, preferredRarity){
  const cards=cardsByWrestlerName(name);
  return cards.find(card=>card.rarity===preferredRarity)
    || cards.find(card=>card.rarity==="Ultime")
    || cards.find(card=>card.rarity==="Rare")
    || cards.find(card=>card.rarity==="Standard")
    || cards[0]
    || null;
}

function cardMatchesCareerStats(card, stats=[]){
  const text=`${card.name||""} ${card.effect||""} ${card.ability||""}`.toLowerCase();
  return stats.some(stat=>text.includes(String(stat).toLowerCase()));
}

function careerSupportPool(entry, rarity=null){
  const priorities=entry.priorityStats||[];
  return CARD_DATA
    .filter(card=>card.type!=="Catcheur"&&(!rarity||card.rarity===rarity))
    .sort((a,b)=>{
      const aMatch=cardMatchesCareerStats(a,priorities)?0:1;
      const bMatch=cardMatchesCareerStats(b,priorities)?0:1;
      return aMatch-bMatch || rarityRank(a.rarity)-rarityRank(b.rarity) || String(a.name).localeCompare(String(b.name));
    });
}

function addCareerKey(keys, card, copies=1){
  if(!card)return;
  const key=cardKey(card);
  for(let i=0;i<copies;i++){
    if(keys.filter(existing=>existing===key).length<2)keys.push(key);
  }
}

function addCareerPool(keys, pool, maxAdds=99){
  let added=0;
  let guard=0;
  while(added<maxAdds&&keys.length<20&&pool.length&&guard<pool.length*4){
    const card=pool[guard%pool.length];
    const before=keys.length;
    addCareerKey(keys,card,1);
    if(keys.length>before)added++;
    guard++;
  }
}

function careerDeckForOpponent(opponent){
  const entry=opponent;
  const byName=cardsByWrestlerName(entry.name);
  const ownUltimate=byName.find(card=>card.rarity==="Ultime");
  const ownStandard=byName.find(card=>card.rarity==="Standard");
  const ownRare=byName.find(card=>card.rarity==="Rare");
  const ownLegend=byName.find(card=>card.rarity==="Legende");
  const keys=[];
  if(entry.ultimateBoss)addCareerKey(keys,ownUltimate,1);
  addCareerKey(keys,ownStandard,2);
  addCareerKey(keys,ownRare,2);

  let legendsToAdd=entry.legendSlots||0;
  while(legendsToAdd>0&&ownLegend){
    addCareerKey(keys,ownLegend,1);
    legendsToAdd--;
    if(keys.filter(key=>key===cardKey(ownLegend)).length>=2)break;
  }
  addCareerPool(keys, careerSupportPool(entry,"Legende"), legendsToAdd);

  const rareTarget=Math.min(8, entry.season===0 ? 6 : 6 + entry.season);
  const rarePool=[
    ...byName.filter(card=>card.rarity==="Rare"),
    ...CARD_DATA.filter(card=>card.type==="Catcheur"&&card.rarity==="Rare"&&cardMatchesCareerStats(card,entry.priorityStats)),
    ...careerSupportPool(entry,"Rare")
  ];
  while(keys.filter(key=>cardByKey(key)?.rarity==="Rare").length<rareTarget&&keys.length<20){
    const before=keys.length;
    addCareerPool(keys, rarePool, 1);
    if(keys.length===before)break;
  }

  const standardPool=[
    ...byName.filter(card=>card.rarity==="Standard"),
    ...CARD_DATA.filter(card=>card.type==="Catcheur"&&card.rarity==="Standard"&&cardMatchesCareerStats(card,entry.priorityStats)),
    ...careerSupportPool(entry,"Standard"),
    ...CARD_DATA.filter(card=>card.rarity==="Standard")
  ];
  addCareerPool(keys, standardPool, 20);
  return legalDeckKeys(keys);
}

function careerMatchOptions(index){
  const opponents=careerOpponents();
  const opponent=opponents[index];
  if(!opponent||opponent.missing)return null;
  return {
    mode:"career",
    careerIndex:index,
    aiLabel:opponent.name,
    aiDeckKeys:careerDeckForOpponent(opponent),
    aiDifficulty:opponent.difficulty,
    aiArchetype:opponent.archetype
  };
}

function replayMatchOptions(){
  if(!G?.matchOptions)return null;
  return {
    ...G.matchOptions,
    playerDeckKeys:[...(G.matchOptions.playerDeckKeys||[])],
    aiDeckKeys:[...(G.matchOptions.aiDeckKeys||[])]
  };
}

function startCareerMatch(index){
  loadPlayerState();
  const opponents=careerOpponents();
  const unlocked=Number(playerState.careerUnlocked)||0;
  if(index>unlocked||!opponents[index]||opponents[index].missing){
    document.getElementById("careerStatus").textContent="Cet adversaire n'est pas encore débloqué.";
    return;
  }
  const options=careerMatchOptions(index);
  if(!options)return;
  showDeckSelect({
    mode:"career",
    returnScreen:"career",
    options
  });
}

function startUnlockedCareerMatch(){
  loadPlayerState();
  const opponents=careerOpponents();
  const unlocked=Math.min(Number(playerState.careerUnlocked)||0,opponents.findLastIndex(opponent=>opponent&&!opponent.missing));
  startCareerMatch(unlocked);
}

function restartCurrentMatch(){
  const options=replayMatchOptions();
  hidePin();
  if(G?.mode==="challenge"){
    const state=ensureAllstarChallengeState();
    if(state.lives<=0||state.completed)return showAllstarChallenge();
    const boss=currentChallengeBossCard();
    const playerDeckKeys=G?.matchOptions?.playerDeckKeys ? [...G.matchOptions.playerDeckKeys] : null;
    if(playerDeckKeys)return startMatch({
      mode:"challenge",
      aiLabel:boss?.name||"Boss ALLSTAR",
      aiDeckKeys:challengeDeckForBoss(boss),
      playerDeckKeys,
      challenge:challengeMatchPayload(state)
    });
    return startAllstarChallenge();
  }
  if(options)return startMatch(options);
  if(G?.mode==="career"&&Number.isInteger(G.careerIndex))return startCareerMatch(G.careerIndex);
  return startGame();
}

function startNextCareerMatch(){
  const next=(Number(G?.careerIndex)||0)+1;
  const playerDeckKeys=G?.matchOptions?.playerDeckKeys ? [...G.matchOptions.playerDeckKeys] : null;
  const options=careerMatchOptions(next);
  hidePin();
  if(options&&playerDeckKeys){
    return startMatch({...options,playerDeckKeys});
  }
  startCareerMatch(next);
}

function renderCareer(){
  loadPlayerState();
  const grid=document.getElementById("careerGrid");
  if(!grid)return;
  const opponents=careerOpponents();
  const unlocked=Number(playerState.careerUnlocked)||0;
  let index=0;
  grid.innerHTML=CAREER_SEASONS.map((season,seasonIndex)=>{
    const items=[];
    for(let i=0;i<season.count;i++){
      const opponent=opponents[index++];
      const itemIndex=index-1;
      const isBoss=opponent?.ultimateBoss;
      const isUnlocked=itemIndex<=unlocked&&opponent&&!opponent.missing;
      const stateClass=isBoss&&!isUnlocked?"boss-locked":isBoss?"boss-final":itemIndex===unlocked?"next":isUnlocked?"cleared":"locked";
      const label=opponent?.missing?"Carte manquante":isBoss?"Boss final":itemIndex===unlocked?"Prochain combat":isUnlocked?"Débloqué":"À débloquer";
      items.push(`<button class="career-opponent ${stateClass}" ${isUnlocked?`onclick="startCareerMatch(${itemIndex})"`:"disabled"}>
        <b>${opponent?.name||"Adversaire"}</b>
        <span>${label}</span>
        ${opponent&&!opponent.missing?`<small>Difficulté ${opponent.difficulty} - ${opponent.archetype.replace(/_/g," ")}</small>`:""}
      </button>`);
    }
    return `<div class="career-season">
      <h2>Saison ${seasonIndex+1}</h2>
      <h3>${season.name}</h3>
      ${items.join("")}
    </div>`;
  }).join("");
}

const DECK_STORAGE_KEY = "allstarsDecks";
const ALLSTARS_SAVE_KEYS = [PLAYER_STORAGE_KEY, DECK_STORAGE_KEY, "catchCardsDecks", "allstarsMockRooms"];
let deckState = {
  decks: [],
  selectedId: null,
  editingId: null,
  loaded: false
};

function resetRuntimeProgress(){
  playerState = {
    credits: 0,
    collection: {},
    starterGranted: false,
    welcomeClaimed: false,
    careerUnlocked: 0,
    loaded: false
  };
  deckState = {
    decks: [],
    selectedId: null,
    editingId: null,
    loaded: false
  };
}

function hasSaveGame(){
  try{
    return Boolean(localStorage.getItem(PLAYER_STORAGE_KEY) || localStorage.getItem(DECK_STORAGE_KEY));
  }catch{
    return false;
  }
}

function setSaveStatus(message){
  const status=document.getElementById("saveStatus");
  if(status)status.textContent=message;
}

function renderSaveScreen(){
  if(document.getElementById("accountChoiceView")){
    showAccountChoice();
    return;
  }
  setSaveStatus("");
}

function enterSavedGame(){
  try{
    loadPlayerState();
    loadDeckState();
    hideOptions();
    show("menu");
    playMusic("menu");
  }catch(error){
    setSaveStatus(`Impossible d'ouvrir la partie : ${error?.message||"erreur inconnue"}.`);
  }
}

function startNewSave(){
  setSaveStatus("Création d'une nouvelle partie...");
  ALLSTARS_SAVE_KEYS.forEach(key=>{
    try{localStorage.removeItem(key)}catch{}
  });
  resetRuntimeProgress();
  enterSavedGame();
}

function loadExistingSave(){
  setSaveStatus("Chargement de la partie...");
  if(!hasSaveGame()){
    renderSaveScreen();
    setSaveStatus("Aucune sauvegarde à charger. Utilise Nouvelle Partie pour démarrer.");
    return;
  }
  resetRuntimeProgress();
  enterSavedGame();
}

function deleteExistingSave(){
  ALLSTARS_SAVE_KEYS.forEach(key=>{
    try{localStorage.removeItem(key)}catch{}
  });
  resetRuntimeProgress();
  renderSaveScreen();
}

function wireSaveScreen(){
  renderSaveScreen();
  const openLoginButton=document.getElementById("openLoginButton");
  const openCreateButton=document.getElementById("openCreateButton");
  const loginButton=document.getElementById("loginAccountButton");
  const createButton=document.getElementById("createAccountButton");
  const guestButton=document.getElementById("guestModeButton");
  const resetButton=document.getElementById("resetPasswordButton");
  const backFromLoginButton=document.getElementById("backFromLoginButton");
  const backFromCreateButton=document.getElementById("backFromCreateButton");
  if(openLoginButton)openLoginButton.onclick=showAccountLogin;
  if(openCreateButton)openCreateButton.onclick=showAccountCreate;
  if(loginButton)loginButton.onclick=loginAccountFromStart;
  if(createButton)createButton.onclick=createAccountFromStart;
  if(guestButton)guestButton.onclick=startGuestMode;
  if(resetButton)resetButton.onclick=sendPasswordResetFromStart;
  if(backFromLoginButton)backFromLoginButton.onclick=showAccountChoice;
  if(backFromCreateButton)backFromCreateButton.onclick=showAccountChoice;
}

function defaultDeck(){
  loadPlayerState();
  const owned=autoDeckFromCollection();
  return {
    id: "starter",
    name: "Deck de départ",
    cards: owned.length ? owned : CARD_DATA.filter(card=>card.rarity==="Standard").map(cardKey)
  };
}

function normalizeOwnedDeckCards(cards){
  loadPlayerState();
  const used={};
  return normalizeDeckCards(cards).filter(key=>{
    const owned=ownedCount(key);
    used[key]=(used[key]||0)+1;
    return used[key]<=owned;
  });
}

function sanitizeDeck(deck, fallbackName="Deck"){
  return {
    id: deck?.id || `deck_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    name: String(deck?.name || fallbackName).slice(0,28),
    cards: normalizeOwnedDeckCards(deck?.cards)
  };
}

function loadDeckState(){
  if (deckState.loaded) return;
  try {
    const saved = JSON.parse(localStorage.getItem(DECK_STORAGE_KEY) || localStorage.getItem("catchCardsDecks") || "null");
    if (saved?.decks?.length) {
      const decks = saved.decks.map((deck, index) => sanitizeDeck(deck, index ? "Deck" : "Deck de départ"));
      deckState = {
        decks,
        selectedId: saved.selectedId && decks.some(deck => deck.id === saved.selectedId) ? saved.selectedId : decks[0].id,
        editingId: null,
        loaded: true
      };
      saveDeckState();
      return;
    }
  } catch {
    // Decks are local convenience data.
  }
  deckState.decks = [defaultDeck()];
  deckState.selectedId = deckState.decks[0].id;
  deckState.editingId = null;
  deckState.loaded = true;
  saveDeckState();
}

function saveDeckState(){
  try {
    localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify({
      decks: deckState.decks,
      selectedId: deckState.selectedId
    }));
  } catch {
    // The game remains usable without localStorage.
  }
  queueCloudSave();
}

function setDeckStatus(message){
  const status = document.getElementById("deckStatus");
  if (status) status.textContent = message;
}

function selectedDeck(){
  return deckState.decks.find(deck => deck.id === deckState.selectedId) || deckState.decks[0] || null;
}

function cardCount(deck, key){
  return deck.cards.filter(card => card === key).length;
}

function deckRarityCount(deck, rarity){
  return deck.cards.filter(key=>cardByKey(key)?.rarity===rarity).length;
}

function deckRuleMessage(deck, key=null){
  if(deck.cards.length > 20)return "Maximum 20 cartes dans un deck.";
  if(deckRarityCount(deck,"Rare") > 8)return "Maximum 8 cartes Rares dans un deck.";
  if(deckRarityCount(deck,"Legende") > 3)return "Maximum 3 cartes Légendaires dans un deck.";
  const counts={};
  for(const cardKeyValue of deck.cards){
    counts[cardKeyValue]=(counts[cardKeyValue]||0)+1;
    if(counts[cardKeyValue] > 2)return "Maximum 2 exemplaires d'une même carte.";
  }
  if(key){
    const card=cardByKey(key);
    if(deck.cards.length >= 20)return "Maximum 20 cartes dans un deck.";
    if(cardCount(deck,key) >= 2)return "Maximum 2 exemplaires d'une même carte.";
    if(card?.rarity==="Rare" && deckRarityCount(deck,"Rare") >= 8)return "Maximum 8 cartes Rares dans un deck.";
    if(card?.rarity==="Legende" && deckRarityCount(deck,"Legende") >= 3)return "Maximum 3 cartes Légendaires dans un deck.";
  }
  return "";
}

function rarityRank(rarity){
  return {Ultime:0,Legende:1,Rare:2,Standard:3,Commune:4}[rarity] ?? 9;
}

function escapeAttr(value){
  return String(value).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function deckCardThumb(card, extraClass=""){
  return `<div class="deck-thumb ${String(card.rarity||"standard").toLowerCase()} ${extraClass}">${cardHTML(card,"","")}</div>`;
}

function setDeckPreview(cardOrKey){
  const preview=document.getElementById("deckPreview");
  if(!preview)return;
  const card=typeof cardOrKey==="string" ? cardByKey(cardOrKey) : cardOrKey;
  preview.innerHTML=card ? `<div class="deck-preview-card">${cardHTML(card,"","")}</div>` : `<div class="preview-empty">Survole une carte</div>`;
}

function renderDeckInventory(deck){
  loadPlayerState();
  const pool=document.getElementById("deckCardPool");
  if(!pool)return;
  const search=String(document.getElementById("deckSearch")?.value||"").trim().toLowerCase();
  const sort=document.getElementById("deckSort")?.value||"name";
  let poolCards=ownedCards().filter(card=>!search || String(card.name||"").toLowerCase().includes(search));
  poolCards.sort((a,b)=>{
    if(sort==="rarity")return rarityRank(a.rarity)-rarityRank(b.rarity) || String(a.name).localeCompare(String(b.name));
    if(sort==="type")return String(a.type).localeCompare(String(b.type)) || String(a.name).localeCompare(String(b.name));
    if(sort==="owned")return ownedCount(cardKey(b))-ownedCount(cardKey(a)) || String(a.name).localeCompare(String(b.name));
    return String(a.name).localeCompare(String(b.name));
  });

  pool.innerHTML=poolCards.map(card=>{
    const key=cardKey(card);
    const count=cardCount(deck,key);
    const owned=ownedCount(key);
    const disabled=count>=owned || Boolean(deckRuleMessage(deck,key));
    const safeKey=escapeAttr(key);
    return `<div class="inventory-card ${String(card.rarity||"standard").toLowerCase()}" draggable="true" onmouseenter="setDeckPreview('${safeKey}')" onclick="setDeckPreview('${safeKey}')" ondragstart="dragDeckCard(event,'${safeKey}')">
      ${deckCardThumb(card)}
      <div class="inventory-card-info">
        <b>${card.name}</b>
        <span>${displayCardType(card.type)} - ${card.rarity||"Standard"}</span>
        <strong>Possédées x${owned} - Deck x${count}</strong>
      </div>
      <button type="button" ${disabled?"disabled":""} onclick="addCardToDeck('${safeKey}')">+</button>
    </div>`;
  }).join("") || `<div class="deck-empty-note">Aucune carte trouvée.</div>`;
}

function renderSelectedDeck(deck){
  const grid=document.getElementById("deckSelectedGrid");
  const meta=document.getElementById("deckEditMeta");
  const nameInput=document.getElementById("deckName");
  if(!grid || !meta || !nameInput)return;
  nameInput.value=deck?.name||"";
  meta.textContent=deck ? `${deck.cards.length}/20 cartes - Rares ${deckRarityCount(deck,"Rare")}/8 - Légendaires ${deckRarityCount(deck,"Legende")}/3` : "Aucun deck sélectionné";
  if(!deck){
    grid.innerHTML=`<div class="deck-empty-note">Crée un deck pour commencer.</div>`;
    return;
  }
  grid.innerHTML=deck.cards.map((key,index)=>{
    const card=cardByKey(key);
    if(!card)return "";
    return `<div class="selected-deck-card" title="Retirer ${escapeAttr(card.name)}">
      <div onmouseenter="setDeckPreview('${escapeAttr(key)}')" onclick="setDeckPreview('${escapeAttr(key)}')">${deckCardThumb(card)}</div>
      <button type="button" onclick="removeCardFromDeck('${escapeAttr(key)}',${index})">-</button>
    </div>`;
  }).join("") || `<div class="deck-empty-note">Glisse des cartes ici depuis l'inventaire.</div>`;
}

function renderDeckManager(){
  loadDeckState();
  document.getElementById("deckEditorShell")?.classList.add("active");
  document.getElementById("deckHub")?.classList.remove("active");
  const current=selectedDeck();
  if(current)deckState.editingId=current.id;
  renderSelectedDeck(current);
  if(current)renderDeckInventory(current);
  setDeckPreview(current?.cards?.[0] || ownedCards()[0] || null);
  setDeckStatus("");
}

function selectDeck(id){
  deckState.selectedId=id;
  deckState.editingId=id;
  saveDeckState();
  closeDeckModal();
  renderDeckManager();
}

function openDeckModal(title,body,actions){
  const modal=document.getElementById("deckModal");
  const modalTitle=document.getElementById("deckModalTitle");
  const modalBody=document.getElementById("deckModalBody");
  const modalActions=document.getElementById("deckModalActions");
  if(!modal || !modalTitle || !modalBody || !modalActions)return;
  modalTitle.textContent=title;
  modalBody.innerHTML=body;
  modalActions.innerHTML=actions;
  modal.classList.add("active");
}

function closeDeckModal(){
  document.getElementById("deckModal")?.classList.remove("active");
}

function openDeckNewModal(){
  loadDeckState();
  const count=deckState.decks.filter(deck=>deck.name.startsWith("Nouveau Deck")).length+1;
  openDeckModal("Nouveau Deck",`<label class="deck-modal-label" for="newDeckName">Nom du deck</label><input id="newDeckName" class="deck-modal-input" maxlength="28" value="Nouveau Deck ${count}">`,`<button class="small-btn" onclick="confirmNewDeck()">Créer</button><button class="small-btn dark" onclick="closeDeckModal()">Annuler</button>`);
  setTimeout(()=>document.getElementById("newDeckName")?.focus(),0);
}

function openDeckNewFromHub(){
  showDeckEditor();
  openDeckNewModal();
}

function confirmNewDeck(){
  const name=String(document.getElementById("newDeckName")?.value||"").trim()||"Nouveau Deck";
  const deck={id:`deck_${Date.now()}`,name:name.slice(0,28),cards:[]};
  deckState.decks.push(deck);
  deckState.selectedId=deck.id;
  deckState.editingId=deck.id;
  saveDeckState();
  closeDeckModal();
  renderDeckManager();
  setDeckStatus("Nouveau deck créé. Glisse des cartes depuis l'inventaire.");
}

function openDeckSelectModal(){
  loadDeckState();
  const body=`<div class="deck-modal-list">${deckState.decks.map(deck=>`<button class="deck-modal-row ${deck.id===deckState.selectedId?"active":""}" onclick="selectDeck('${escapeAttr(deck.id)}')"><span>${deck.name}</span><b>${deck.cards.length} cartes</b></button>`).join("")}</div>`;
  openDeckModal("Modifier Deck",body,`<button class="small-btn dark" onclick="closeDeckModal()">Retour</button>`);
}

function openDeckSelectFromHub(){
  showDeckEditor();
  openDeckSelectModal();
}

function openDeckDeleteModal(){
  loadDeckState();
  const deck=selectedDeck();
  if(!deck){setDeckStatus("Aucun deck à effacer.");return;}
  openDeckModal("Effacer Deck",`<p class="deck-confirm-text">Effacer <b>${deck.name}</b> ?</p>`,`<button class="small-btn danger" onclick="confirmDeleteDeck()">Oui</button><button class="small-btn dark" onclick="closeDeckModal()">Non</button>`);
}

function openDeckDeleteFromHub(){
  showDeckEditor();
  openDeckDeleteModal();
}

function newDeck(){openDeckNewModal();}
function editDeck(){openDeckSelectModal();}
function deleteDeck(){openDeckDeleteModal();}

function dragDeckCard(event,key){
  event.dataTransfer?.setData("text/plain",key);
  event.dataTransfer?.setData("card-key",key);
}

function dropCardToDeck(event){
  event.preventDefault();
  event.currentTarget?.classList.remove("drop-ready");
  const key=event.dataTransfer?.getData("card-key") || event.dataTransfer?.getData("text/plain");
  if(key)addCardToDeck(key);
}

function addCardToDeck(key){
  const deck=selectedDeck();
  if(!deck || !cardByKey(key))return;
  if(cardCount(deck,key)>=ownedCount(key)){
    setDeckStatus("Tu n'as pas d'autre exemplaire de cette carte.");
    return;
  }
  const ruleMessage=deckRuleMessage(deck,key);
  if(ruleMessage){
    setDeckStatus(ruleMessage);
    return;
  }
  deck.cards.push(key);
  deckState.editingId=deck.id;
  saveDeckState();
  renderDeckManager();
}

function removeCardFromDeck(key,index=null){
  const deck=selectedDeck();
  if(!deck)return;
  const targetIndex=Number.isInteger(index) ? index : deck.cards.lastIndexOf(key);
  if(targetIndex>=0)deck.cards.splice(targetIndex,1);
  deckState.editingId=deck.id;
  saveDeckState();
  renderDeckManager();
}

function saveDeck(){
  const deck=selectedDeck();
  const nameInput=document.getElementById("deckName");
  const nextName=nameInput?.value.trim();
  if(!deck || !nextName){
    setDeckStatus("Donne un nom au deck.");
    return;
  }
  if(!deck.cards.some(key=>cardByKey(key)?.type==="Catcheur")){
    setDeckStatus("Ajoute au moins un catcheur au deck.");
    return;
  }
  const ruleMessage=deckRuleMessage(deck);
  if(ruleMessage){
    setDeckStatus(ruleMessage);
    return;
  }
  deck.name=nextName.slice(0,28);
  deck.cards=normalizeDeckCards(deck.cards);
  deckState.selectedId=deck.id;
  deckState.editingId=deck.id;
  saveDeckState();
  renderDeckManager();
  setDeckStatus(`Deck sauvegardé : ${deck.name}`);
}

function cancelDeckEdit(){renderDeckManager();}

function confirmDeleteDeck(){
  const deck=selectedDeck();
  if(!deck){closeDeckModal();return;}
  if(deckState.decks.length===1){
    closeDeckModal();
    setDeckStatus("Il faut garder au moins un deck.");
    return;
  }
  deckState.decks=deckState.decks.filter(item=>item.id!==deck.id);
  deckState.selectedId=deckState.decks[0]?.id||null;
  deckState.editingId=deckState.selectedId;
  saveDeckState();
  closeDeckModal();
  renderDeckManager();
  setDeckStatus(`Deck effacé : ${deck.name}`);
}

Object.assign(window,{
  startNewSave,
  loadExistingSave,
  deleteExistingSave,
  showAllstarChallenge,
  startAllstarChallenge,
  openTicketBooster,
  startCareerMatch,
  startUnlockedCareerMatch,
  restartCurrentMatch,
  startNextCareerMatch,
  startOnlineMatchFromRoom,
  applyOnlineRoomSnapshot,
  showDeckSelect,
  selectLaunchDeck,
  confirmDeckReady,
  cancelDeckSelect,
  openDeckNewFromHub,
  openDeckSelectFromHub,
  openDeckDeleteFromHub,
  showDeckEditor,
  showPileViewer,
  closePileViewer,
  discardPlayerCard,
  runAllstarAudit,
  showProfile,
  createProfileAccount,
  loginProfileAccount,
  logoutProfileAccount,
  createAccountFromStart,
  loginAccountFromStart,
  sendPasswordResetFromStart,
  showAccountChoice,
  showAccountLogin,
  showAccountCreate,
  startGuestMode,
  requestProfileLogout,
  requestQuitGame,
  confirmProfileLogout,
  confirmQuitGame,
  closeSessionModal
});
document.addEventListener("DOMContentLoaded", ()=>{
  runAllstarAudit();
  wireSaveScreen();
  wireDisplayOptions();
  showInstalledVersion();
  window.AllstarDesktop?.onDesktopEvent?.(({type})=>{
    if(type==="update-checking")showSystemToast("Recherche d'une mise a jour...");
    if(type==="update-available")showSystemToast("Mise a jour trouvee : telechargement en cours...",5000);
    if(type==="update-not-available")showSystemToast("Jeu deja a jour.",3000);
    if(type==="update-downloaded")showSystemToast("Mise a jour prete : redemarrage automatique...",5000);
    if(type==="update-error")showSystemToast("Verification de mise a jour impossible.",4000);
  });
  document.addEventListener("keydown",handleEscapeKey);
});
