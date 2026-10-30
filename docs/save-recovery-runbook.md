# Sauvegardes ALLSTAR : protection et récupération

Ce processus fait partie du projet. Il a été conservé après l'incident du 30 octobre 2026 ; les fichiers des joueurs restent privés, hors Git et hors publication. Les deux dossiers privés de cet incident se trouvent dans l'espace de travail `outputs/incident-sauvegardes-2026-10-30/`, pas dans ce dépôt.

## Protections du client depuis 0.2.35

- Toutes les écritures normales passent par `commitProgression`, avec comparaison de la version effectivement lue. Les anciennes fonctions d'écriture sans contrôle sont désactivées.
- Le jeu actuel ne consomme pas de cartes de collection et ne fait pas régresser la carrière pendant une partie normale. Une diminution de ces données est donc refusée. Les crédits et tickets peuvent diminuer normalement lorsqu'ils sont dépensés. Ne pas utiliser une fusion par maximum pour ces ressources.
- `cloudSaveHistory` est enregistré dans la même transaction que la progression : une première copie de référence est conservée et jusqu'à cinq copies récentes distinctes sont retenues. Un changement de dates sans changement de contenu ne remplace pas une copie utile. L'historique dispose d'un budget de 400 ko et la proposition de document complet de 750 ko ; si une copie indispensable ne peut pas être gardée dans ces limites, l'écriture est refusée. Il ne s'agit pas d'un historique illimité.
- L'historique ne se recopie pas récursivement dans `profileProgress`. Il contient les états joueur/decks et les champs utiles du profil, sans identifiants de connexion.
- Les copies brutes `allstarsRecovery:*` sont créées avant de remplacer un cache local du compte, même sans modifications en attente. Les anciennes clés non associées au compte sont conservées séparément lorsque leur UID embarqué correspond exactement au compte connecté.
- Une ancienne copie PC du même compte plus complète déclenche une vérification, sans fusion automatique. Un profil connu sans sauvegarde complète, ou une carrière inférieure à un adversaire déjà battu, ne reçoit pas un nouveau départ automatique. Les retraits de cartes volontaires du catalogue ne sont pas réintroduits par ce contrôle.
- Le contenu écrit en cache est relu avant d'activer la session. Un échec n'autorise pas une sauvegarde vide de remplacement. Les réponses de chargements dépassés ou d'un autre compte sont rejetées.
- Le dialogue « Sauvegarde protégée » permet de fournir un fichier de récupération déjà vérifié. Les imports ordinaires restent suspendus. Les deux fichiers déjà examinés sont reconnus par leur empreinte canonique et ne peuvent être appliqués qu'une fois sur le compte correspondant.

Ces contrôles sont ceux de cette version cliente. Ils ne rendent pas les anciennes versions incapables d'écrire à distance ; les règles Firestore existantes n'ont pas été durcies pendant cette intervention. L'historique dans le document du compte utilise les permissions actuelles et ne constitue pas une sauvegarde administrative indépendante ou un verrou immuable côté serveur. Ne pas annoncer une garantie absolue ou un blocage distant déjà déployé. Aucune nouvelle règle, fonction serveur, permission ou facturation n'est configurée par les outils ci-dessous.

## 1. Conserver les sources

En cas de perte signalée : garder ALLSTAR fermé sur les deux appareils, ne pas refaire d'import, ne pas réinstaller et ne pas vider les données. Conserver le JSON exporté, même s'il est incomplet.

Sur le PC concerné, copier uniquement le sous-dossier **Local Storage**, normalement situé dans `%APPDATA%/allstar-desktop/`, puis compresser la copie. Ne pas demander tout le profil Electron : il peut contenir des identifiants mémorisés et des données d'authentification inutiles à cette analyse. Garder l'original intact.

Chaque joueur dispose d'un dossier d'analyse distinct. Un poste peut contenir plusieurs comptes ; ne pas supposer qu'un ZIP ne concerne qu'une personne.

## 2. Lire une archive sans ouvrir la base

Depuis le dépôt, avec Python 3 standard (sans installation de bibliothèque) :

```powershell
python tools/read_local_storage_archive.py "CHEMIN/Local Storage.zip" "outputs/recuperation-joueur-01"
```

Le dossier de sortie doit être nouveau et vide. Le lecteur lit les octets de l'archive, pas une base LevelDB active. Il traite les tables SST compressées Snappy et les journaux WriteBatch, vérifie les sommes CRC32C et les longueurs. Il conserve une copie du ZIP, ses empreintes et les enregistrements utiles dans `records-private.json`. Une erreur de lecture bloque l'analyse ; ne pas la présenter comme une absence de sauvegarde.

Références du format : [tables LevelDB](https://github.com/google/leveldb/blob/main/doc/table_format.md), [journaux LevelDB](https://github.com/google/leveldb/blob/main/doc/log_format.md), [compression Snappy](https://github.com/google/snappy/blob/main/format_description.txt).

## 3. Inspecter toutes les copies, sans choisir automatiquement

```powershell
node tools/recover_account_save.cjs inspect "outputs/recuperation-joueur-01/records-private.json" "outputs/recuperation-joueur-01/candidats"
```

Le dossier de candidats doit être nouveau. L'outil reconnaît les anciennes sauvegardes, les clés par compte, les copies locales, les modifications en attente, les caches de profil et les historiques `cloudSaveHistory`. Il peut aussi inspecter directement un JSON privé du document du compte ou une enveloppe `allstar-local-recovery-v1`.

Les identités sont abrégées dans la console ; les candidats et le rapport complets restent privés. Les sauvegardes sans identité démontrée ne sont pas automatiquement attribuées à un joueur. L'UID du candidat, du cache correspondant et du JSON de référence doivent correspondre. Vérifier aussi les dates, séquences, cartes, crédits, carrière et decks avec le joueur.

Ne pas choisir simplement le plus grand nombre de cartes, le solde le plus élevé ou la date la plus récente. Un solde inférieur peut venir d'une dépense légitime. Ne pas fusionner les candidats, les comptes ou les récompenses. Les anciens decks sans UID sont liés par origine et séquence seulement : leur provenance et les cartes réellement possédées doivent être examinées séparément.

## 4. Produire un fichier séparé

Après examen explicite du candidat choisi :

```powershell
node tools/recover_account_save.cjs build "outputs/recuperation-joueur-01/candidats/candidate-0001.json" "outputs/recuperation-joueur-01/sauvegarde-recuperee.json" --reference "CHEMIN/export-original.json"
```

L'outil refuse d'écraser un fichier existant. Il conserve les cartes, crédits et carrière du candidat, nettoie les anciens miroirs récursifs du profil, contrôle les decks et valide le format avec le jeu courant. Aucun accès au compte n'est effectué.

Par défaut, aucun dédommagement n'est ajouté. Une instruction humaine explicite est nécessaire pour l'utiliser, avec montant, raison et marqueur unique :

```powershell
node tools/recover_account_save.cjs build "CANDIDAT.json" "NOUVEAU-FICHIER.json" --reference "REFERENCE.json" --compensation 5000 --reason "Instruction explicite du responsable" --grant-id "recuperation_incident_unique"
```

Le montant de l'incident précédent n'est pas une autorisation permanente. L'outil refuse un marqueur déjà présent. Une carte inconnue n'est jamais supprimée silencieusement ; le retrait historique de Yann Le Kersaudec légendaire peut être archivé explicitement avec `--archive-retired`. Cela conserve sa trace dans les métadonnées, sans réintroduire la carte jouable.

## 5. Vérifier et approuver avant toute restauration

Comparer le fichier produit aux sources. Garder l'archive originale, le candidat et les contrôles. Le constructeur affiche l'empreinte SHA-256 du JSON canonique trié. Un fichier nouvellement créé n'est **pas automatiquement autorisé à l'import** : son contenu doit être examiné et son empreinte ajoutée explicitement à `APPROVED_ACCOUNT_RECOVERY_HASHES`, puis la version correspondante publiée. Ne pas modifier ou régénérer un fichier après cette approbation.

Tester sa sélection, le bon compte, le récapitulatif et sa confirmation sur des données simulées avec les mêmes fonctions du jeu, sans connexion réelle. Le reçu d'application empêche de recommencer. Si la transaction réussit mais que l'affichage ne se recharge pas ensuite, le jeu indique le succès de l'enregistrement et demande une réouverture ; ne pas appliquer le fichier une deuxième fois.

Après publication de la version prévue, le joueur se connecte au même compte, laisse le PC fermé pendant l'import mobile, choisit le fichier correspondant, vérifie le récapitulatif et confirme. Rouvrir ensuite le PC pour charger la progression du compte. Vérifier les cartes, crédits, carrière et decks avec le joueur ; ne pas annoncer une restauration effective avant cette confirmation.

## Tests maintenus

```powershell
npm run test:accounts
python tools/read_local_storage_archive_test.py
npm run verify
```

Les tests du lecteur utilisent des fichiers binaires synthétiques (tables compressées, clés partagées, journaux fragmentés, contrôles d'intégrité et corruption). Ceux du constructeur vérifient l'identité des comptes, la compensation explicite, les cartes retirées, les decks, l'empreinte et le refus d'écrasement. Ceux des comptes couvrent les conflits, les régressions, le stockage défaillant, les sessions concurrentes, l'historique et les récupérations contrôlées.

Ne jamais mettre des fichiers de joueurs dans Git, les tests CI ou les publications. Le paquet Windows et le site mobile n'embarquent pas ces outils ni leurs dossiers privés.
