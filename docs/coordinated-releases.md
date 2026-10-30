# Publication Windows et mobile

Le workflow existant **Publish Windows Release** est conservé. La modification locale ajoute la construction mobile depuis le même commit et la même version, puis la publication Firebase juste avant la release Windows. Seule la branche `main` peut publier. L'adresse mobile reste `https://allstar-mobile-65102.web.app/`.

## Parcours prévu

1. Vérifications habituelles et tests des sauvegardes du compte.
2. Construction Windows, contrôles de l'installateur et des fichiers de mise à jour. Aucune publication implicite par electron-builder.
3. Construction mobile avec Python/Pillow/FFmpeg, puis contrôle de correspondance version/commit.
4. Authentification temporaire GitHub → Google, vérification/création du tag de version.
5. Publication uniquement du site Firebase `allstar-mobile-65102` via `firebase.mobile.json`.
6. Publication de la release Windows avec le mécanisme existant.

Les deux constructions doivent réussir avant la publication mobile. Les services Firebase et GitHub ne proposent pas de transaction commune : si la dernière publication Windows échoue après réussite de Firebase, la version mobile peut précéder Windows. Relancer le même workflow sur le même commit permet de reprendre ; ne pas déplacer le tag vers un autre commit. La version package.json doit être augmentée pour une nouvelle release.

## Installation mobile

Conserver la même adresse et le même identifiant de manifest. L'icône reste installée. Les documents, scripts et styles sont revalidés auprès du serveur ; une ouverture fraîche récupère la nouvelle version sans réinstallation. Une page qui reste ouverte garde son code jusqu'au rechargement : aucune recharge forcée pendant un match. Si l'application est simplement restée en arrière-plan, la fermer complètement puis la rouvrir, ou recharger la page, suffit.

Les images mises en cache sont isolées par empreinte du contenu de chaque construction, puis les anciens caches ALLSTAR sont nettoyés à l'activation du nouveau service worker. Les ressources sources modifiées sont réencodées même si leur nom ne change pas. Les sauvegardes/comptes restent sur Firebase et ne sont pas des fichiers du paquet mobile.

## Accès Google activé — 30 octobre 2026

Anthony a explicitement autorisé la configuration proposée après présentation des droits. Le compte de publication et la confiance GitHub sont maintenant créés ; leur état et leurs permissions ont été relus et vérifiés par les API Google. Les API IAM et STS ont été activées, IAM Credentials était déjà disponible. Aucune clé privée créée, aucun rôle d'administration Auth/Firestore/Realtime ajouté. Rapport local sans identifiant secret : `outputs/allstar-release-identity.json` dans l'espace de travail parent.

Configuration active :

- Projet existant : `allstar-65102` (`516002177429`).
- Compte technique : `allstar-mobile-release@allstar-65102.iam.gserviceaccount.com`.
- Rôles projet : `roles/firebasehosting.admin` (gestion de l'hébergement, y compris les sites du projet) et `roles/serviceusage.apiKeysViewer` (lecture des clés API de configuration requise par la CLI). Aucun rôle d'administration Auth, Firestore ou Realtime Database.
- Pool d'identités `allstar-releases`, fournisseur `github`, issuer `https://token.actions.githubusercontent.com`. Activer les API IAM, IAM Credentials et Security Token Service si nécessaire.
- Confiance limitée au dépôt GitHub ID `1298128377`, propriétaire ID `302782871`, branche `refs/heads/main`, workflow `EdwardMinaro/allstar.tcg/.github/workflows/publish-release.yml@refs/heads/main` (casse canonique retournée par GitHub).
- `roles/iam.workloadIdentityUser` sur ce seul compte technique pour le principal du dépôt dans ce pool.
- Aucun fichier de clé privée à générer ou à mettre dans GitHub. Les identifiants temporaires créés par l'action sont exclus du dépôt et du contenu publié.

Les autres politiques IAM ont été conservées avec leur etag. Aucun secret ou réglage GitHub supplémentaire à saisir : le workflow utilise son GITHUB_TOKEN natif et l'identité OIDC temporaire. Il reste à mettre les fichiers du workflow sur GitHub pour qu'il utilise cette configuration. Le premier lancement distant reste à valider lors de la prochaine release : cette étape ne déclenche aucune nouvelle publication du jeu. Augmenter la version package.json pour une nouvelle release comme auparavant ; ne jamais réutiliser un tag pointant vers un autre commit.
