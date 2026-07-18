<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.de.md">Deutsch</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.fr.md"><strong>Français</strong></a>
</p>

<p align="center">
  <img src="docs/images/vidselector-hero.png" alt="Bannière abstraite de VidSelector avec des cartes de films et un parcours de recommandation personnalisé" width="100%">
</p>

<h1 align="center">VidSelector</h1>

<p align="center">
  <strong>Une application privée et auto-hébergée de recommandation de films et séries, sans suivi et avec des recommandations explicables.</strong>
</p>

<p align="center">
  <a href="https://github.com/DevMatze/VidSelector/actions/workflows/ci.yml"><img src="https://github.com/DevMatze/VidSelector/actions/workflows/ci.yml/badge.svg" alt="État de la CI"></a>
  <img src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs" alt="Next.js 16">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5">
  <img src="https://img.shields.io/badge/SQLite-local-003B57?logo=sqlite" alt="Base de données SQLite locale">
  <img src="https://img.shields.io/badge/usage-personnel%20et%20non%20commercial-ef4056" alt="Usage personnel et non commercial">
</p>

![Tableau de bord de VidSelector](docs/images/dashboard.png)

VidSelector est une application web locale qui permet de noter des films et des séries, puis de transformer ces évaluations en recommandations personnelles. Elle utilise un seul profil par défaut, mais des profils locaux distincts peuvent être activés pour les membres du foyer. Il n’y a ni connexion, ni publicité, ni suivi externe, ni service VidSelector hébergé : les profils et les évaluations restent dans votre propre base de données SQLite.

> [!IMPORTANT]
> VidSelector est un projet personnel, non commercial et réalisé comme loisir. Ce n’est ni un service de streaming ni une plateforme multi-utilisateur publique.

## Pourquoi VidSelector ?

- **Vos propres évaluations :** `J’aime`, `Neutre` ou `Pas pour moi`
- **Liste simple :** enregistrez ou retirez les titres intéressants en un clic
- **Recommandations fondées sur des règles :** des scores explicables plutôt qu’une IA opaque
- **Films et séries séparés :** dans les catégories, la recherche et la bibliothèque
- **Navigation inspirée de Netflix :** carrousels, flèches dynamiques et pages « Voir plus » dédiées
- **Anime comme facette distincte :** l’animation japonaise est distinguée de l’animation occidentale
- **Détails complets :** distribution, équipe créative, durée, saisons, bandes-annonces et titres similaires
- **Disponibilité en Allemagne :** options séparées pour le streaming, la location et l’achat
- **Cache local-first :** SQLite est interrogé avant TMDB
- **Protection locale des données :** export versionné, import validé et sauvegardes automatiques
- **Mode démo :** essayez l’application sans identifiants d’API
- **Interface adaptative :** pour ordinateur et mobile
- **Interface multilingue :** allemand, anglais, espagnol et français par profil
- **Gestion facultative des profils :** profils locaux distincts sans compte cloud ni connexion
- **Configuration YAML validée :** serveur, recommandations, sauvegardes, journalisation et fonctionnalités

## Démarrage rapide

### Prérequis

- Node.js 20 ou version ultérieure (la CI utilise Node.js 22)
- npm
- facultatif : accès gratuit à l’API TMDB pour le catalogue complet

### Installation

```bash
git clone https://github.com/DevMatze/VidSelector.git
cd VidSelector
npm install
cp .env.example .env
cp config.example config.yml
npm run setup
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) sur l’ordinateur. Sans identifiants TMDB, VidSelector utilise automatiquement son catalogue de démonstration intégré.

`npm run setup` applique les migrations de la base de données et crée un petit profil d’exemple. Pour démarrer sans données d’exemple, utilisez :

```bash
npm run db:push
```

## Fonctionnement des recommandations

VidSelector n’entraîne aucun modèle d’IA ou d’apprentissage automatique. Les recommandations sont produites localement grâce à une pondération transparente fondée sur des règles :

```text
Évaluations
   │
   ├── genres et facette anime
   ├── langue originale et décennie
   ├── distribution et équipe créative
   └── titres similaires évalués positivement ou négativement
            │
            ▼
        score pondéré
            │
            ▼
   recommandations diversifiées
```

La note publique, le nombre de votes et la popularité constituent des signaux de qualité supplémentaires. Les titres déjà évalués sont exclus, tandis que les tendances négatives diminuent activement le score des candidats similaires. Les impressions répétées, les clics prudemment pondérés et les titres explicitement ignorés améliorent la rotation sans remplacer une véritable évaluation. Les pondérations principales sont définies dans [`lib/recommendations/config.ts`](lib/recommendations/config.ts).

### Accueil limité, catégories complètes

- **Meilleure sélection pour vous :** jusqu’à 50 films et 50 séries en tête par défaut
- **Films pour vous :** jusqu’à 50 films supplémentaires hors sélections principale et découverte
- **Séries pour vous :** jusqu’à 50 séries supplémentaires hors sélections principale et découverte
- **Essayez quelque chose de nouveau :** jusqu’à 50 découvertes distinctes de films et de séries

Les quotas de films et de séries sont comptés séparément, mais un titre n’est affecté qu’à une seule section de la page d’accueil. Les pages « Voir plus » associées n’ont pas la limite de 50 titres : elles présentent l’ensemble des recommandations actuellement calculées pour la catégorie choisie, d’abord 20 titres puis par lots de 20 par défaut. Ces deux valeurs sont modifiables dans `config.yml`. Comme ces vues étendues utilisent un filtrage sémantique plutôt que les quotas de l’accueil, un titre pertinent peut apparaître dans plusieurs vues appropriées.

### Évaluations et liste

Une évaluation décrit vos goûts : « J’aime » renforce les attributs similaires, « Pas pour moi » les affaiblit et « Neutre » enregistre le titre sans préférence positive ou négative. La liste est indépendante et sert uniquement à conserver des titres intéressants pour plus tard.

### Anime ou animation ?

TMDB ne propose pas l’anime comme genre distinct. VidSelector déduit donc cette facette de deux attributs explicites :

```text
Genre « Animation » + langue originale japonaise = Anime
```

Cela permet par exemple de séparer les séries d’anime japonaises des productions d’animation occidentales. Cette heuristique volontairement simple peut différer pour les coproductions internationales.

## Confidentialité et sécurité

- aucun compte en ligne ni synchronisation cloud
- aucun service d’analyse, de publicité ou de suivi
- authentification TMDB côté serveur
- vérification de l’origine des requêtes d’écriture de l’API
- limitation du débit des routes qui sollicitent fortement l’API
- exports et sauvegardes locaux et validés
- en-têtes de sécurité

Les profils, évaluations, listes, historiques de recommandation et signaux anonymes d’interaction avec les recommandations sont stockés localement dans SQLite. Les identifiants TMDB restent sur le serveur Next.js et ne doivent jamais être ajoutés à Git ni apparaître dans une capture d’écran.

Ne signalez pas les problèmes de sécurité dans une issue publique. Suivez plutôt les instructions de [`SECURITY.md`](SECURITY.md).

## Limites et modèle de menace

- VidSelector ne fournit lui-même aucun film, série ou flux vidéo.
- Les disponibilités proviennent de TMDB/JustWatch, concernent l’Allemagne et peuvent changer.
- L’application ne possède ni authentification ni contrôle d’accès. Tout appareil pouvant atteindre le port 3000 peut sélectionner des profils et modifier leurs données.
- Les profils locaux sont une commodité pour un réseau domestique de confiance, pas des comptes utilisateur sécurisés.
- Ne configurez pas de redirection de port sur le routeur et n’utilisez pas VidSelector sur un réseau Wi-Fi public ou non fiable.
- Un déploiement public nécessiterait au préalable une véritable authentification, TLS et un audit de sécurité indépendant.
- Le code source est publiquement visible, mais n’est pas placé sous licence open source ; consultez la section [Licence](#licence).

## Installation et configuration complètes

### Accès depuis le réseau local

Le serveur de développement écoute également sur le réseau local. Si l’ordinateur et le téléphone utilisent le même Wi-Fi, ouvrez sur le téléphone une adresse telle que `http://192.168.0.242:3000`, en la remplaçant par l’adresse IP LAN réelle de l’ordinateur. Sous Linux, `hostname -I` permet notamment de l’afficher.

Si la page reste inaccessible, vérifiez que les deux appareils sont sur le même réseau et que le pare-feu local autorise les connexions TCP entrantes sur le port 3000 depuis le réseau privé. La redirection de port du routeur n’est ni nécessaire ni recommandée.

### Activer TMDB

Pour utiliser le catalogue complet :

1. Créez des identifiants dans les [paramètres de l’API TMDB](https://www.themoviedb.org/settings/api).
2. Ouvrez `.env` et saisissez de préférence le jeton d’accès en lecture v4.
3. Définissez `catalog.force_demo: false` dans `config.yml`, puis redémarrez le serveur.

```dotenv
TMDB_BEARER_TOKEN=
TMDB_API_KEY=
DATABASE_URL="file:./dev.db"
```

La clé classique `TMDB_API_KEY` est également prise en charge. Les deux identifiants restent exclusivement sur le serveur Next.js.

### Configuration

`config.example` documente en allemand tous les paramètres disponibles. Copiez-le sous le nom `config.yml` ; ce fichier local est exclu de Git. Les valeurs invalides, options inconnues ou types incorrects interrompent le démarrage du serveur avec une erreur claire au lieu d’être ignorés silencieusement.

Les paramètres disponibles comprennent :

- l’adresse et le port d’écoute
- la langue par défaut des nouveaux profils ; la langue sélectionnée est ensuite enregistrée par profil
- le mode `simple` pour un utilisateur ou `multiple` pour la gestion des profils locaux
- l’utilisation forcée du catalogue de démonstration
- la limite de l’accueil, la taille des lots et les explications des recommandations
- le répertoire, les déclencheurs et la conservation des sauvegardes
- le niveau de journalisation, la journalisation des requêtes et un fichier facultatif
- l’import/export de profil, les fournisseurs, les bandes-annonces et les titres similaires

Les identifiants et `DATABASE_URL` restent volontairement dans `.env`. Les options de fonctionnalités désactivent à la fois l’interface visible et les routes API ou requêtes externes associées.

Le mode simple pour un seul utilisateur reste la valeur par défaut :

```yaml
users:
  mode: "simple"
```

Avec `mode: "multiple"`, un sélecteur de profil et une page de gestion apparaissent. Chaque utilisateur dispose de son propre cache multimédia, de ses évaluations, recommandations, liste, langue, données d’import/export et sauvegardes de profil.

### Exécuter comme service local

Après la compilation de production, VidSelector peut fonctionner comme service utilisateur systemd :

```bash
npm run build
./scripts/install-service.sh
```

Les commandes habituelles sont ensuite disponibles :

```bash
systemctl --user status vidselector
systemctl --user restart vidselector
journalctl --user -u vidselector -f
```

Le service utilise `server.host` et `server.port` définis dans `config.yml` (`0.0.0.0:3000` par défaut). Il reste donc accessible via `http://localhost:3000` et `http://<IP-LAN-de-l-ordinateur>:3000` sur le réseau domestique de confiance.

### Cache local et stockage des données

| Contenu                             |      Conservation |
| ----------------------------------- | ----------------: |
| Résultats de recherche              |         24 heures |
| Détails et données des fournisseurs |           7 jours |
| Données multimédias générales       |          30 jours |
| Ensemble du contenu TMDB            | 180 jours maximum |

Les données multimédias expirées et inutilisées sont supprimées. Si un titre est toujours lié à une évaluation personnelle, celle-ci est conservée tandis que les métadonnées TMDB expirées sont retirées puis récupérées à la prochaine demande de détails. Votre profil est ainsi préservé sans conserver le contenu TMDB pendant plus de six mois.

Les éléments suivants ne sont pas stockés dans Git :

- `.env` et les identifiants d’API
- `config.yml` avec les paramètres locaux
- `prisma/dev.db` avec les profils et évaluations
- les artefacts de compilation, de couverture et de test
- `node_modules`
- les sauvegardes locales sous `backups/`

### Export, import et sauvegardes

Dans **Paramètres → Sauvegarde**, vous pouvez exporter le nom et la langue du profil, les évaluations et la liste dans un fichier JSON versionné. L’import permet de fusionner ou de remplacer complètement les données. VidSelector crée une sauvegarde locale supplémentaire avant un import ou une réinitialisation du profil.

Par défaut, `npm run db:push` crée aussi une sauvegarde SQLite cohérente avant chaque migration. Le répertoire, les déclencheurs et la conservation sont contrôlés dans `config.yml`. Les valeurs par défaut conservent dix sauvegardes de base de données, sept sauvegardes quotidiennes des profils et jusqu’à quatre anciens instantanés hebdomadaires. Ces fichiers ne quittent jamais votre ordinateur.

## Développement

### Contrôles qualité

```bash
npm run lint
npm run typecheck
npm run format:check
npm test
npm run test:coverage
npm run test:e2e
npm run build
```

GitHub Actions exécute automatiquement le linting, les vérifications de types et de format, la couverture, la compilation de production et les tests de navigateur sur ordinateur et mobile.

### Architecture

```text
app/                    pages Next.js et routes API internes
components/             composants React adaptatifs
lib/tmdb.ts             intégration TMDB côté serveur
lib/media-cache.ts      cache des requêtes, médias et détails
lib/data.ts             persistance Prisma et profil local
lib/recommendations/    création du profil, classement et diversification
lib/profile-transfer.ts format versionné d’export et d’import
lib/profile-backups.ts  sauvegardes locales automatiques des profils
lib/config.mjs          configuration YAML validée
lib/i18n.ts             traductions extensibles de l’interface
prisma/                 schéma SQLite, migrations et données initiales
tests/e2e/              tests de bon fonctionnement Playwright
deploy/                 modèle de service systemd
```

### Commandes

| Commande                | Fonction                                                  |
| ----------------------- | --------------------------------------------------------- |
| `npm run dev`           | Démarrer le serveur de développement                      |
| `npm run build`         | Créer une compilation de production                       |
| `npm run start`         | Démarrer le serveur de production local                   |
| `npm run setup`         | Appliquer les migrations et ajouter les données d’exemple |
| `npm run db:push`       | Appliquer les migrations Prisma                           |
| `npm run db:backup`     | Créer une sauvegarde SQLite cohérente                     |
| `npm run db:migrate`    | Migrer sans l’étape de sauvegarde supplémentaire          |
| `npm run db:seed`       | Créer le profil d’exemple                                 |
| `npm run lint`          | Exécuter ESLint                                           |
| `npm run typecheck`     | Vérifier TypeScript                                       |
| `npm test`              | Exécuter les tests unitaires, API et de composants        |
| `npm run test:coverage` | Créer un rapport de couverture                            |
| `npm run test:e2e`      | Exécuter les tests de navigateur sur ordinateur et mobile |
| `npm run format`        | Formater les fichiers avec Prettier                       |

## Contribuer

Les améliorations bien délimitées et les rapports de bogues reproductibles sont les bienvenus. Lisez [`CONTRIBUTING.md`](CONTRIBUTING.md) avant d’ouvrir une pull request, respectez [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) et signalez les vulnérabilités de manière privée conformément à [`SECURITY.md`](SECURITY.md).

## Transparence du développement

VidSelector a été conçu, développé, testé et documenté avec l’aide de l’IA générative, notamment **OpenAI Codex**. Les décisions d’architecture, le choix des modifications, la vérification technique et la responsabilité de la version publiée relèvent du mainteneur. Le système de recommandation lui-même n’utilise pas d’IA générative et n’envoie aucune donnée personnelle sur vos goûts à un service d’IA.

Toutes les modifications publiées sont consignées dans [`CHANGELOG.md`](CHANGELOG.md).

## Sources des données, marques et mentions légales

This product uses the TMDB API but is not endorsed or certified by TMDB.

Les données et images des films et séries proviennent de [The Movie Database (TMDB)](https://www.themoviedb.org). Le logo TMDB utilisé dans l’application est officiel, inchangé et présenté de manière moins visible que l’identité propre de VidSelector.

Les disponibilités en streaming sont fournies par TMDB et proviennent de son partenariat avec **JustWatch**. Elles peuvent changer ; VidSelector renvoie vers la page fournie par TMDB pour plus d’informations.

L’utilisation de l’API TMDB est toujours soumise aux [conditions d’utilisation actuelles de TMDB](https://www.themoviedb.org/api-terms-of-use). Toute personne exploitant une instance doit disposer de ses propres identifiants TMDB et veiller au respect de ces conditions. Ce projet n’est pas destiné à un usage commercial, lequel peut nécessiter un accord écrit distinct avec TMDB.

VidSelector ne fournit aucun film, série ou flux vidéo. Toutes les marques, tous les titres, images et autres contenus restent la propriété de leurs détenteurs respectifs.

## Licence

Le code source est publiquement consultable, mais n’est pas placé sous licence open source. [`LICENSE.md`](LICENSE.md) s’applique : **Tous droits réservés**.

Copyright © 2026 DevMatze.
