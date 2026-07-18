<p align="center">
  <a href="README.md"><strong>English</strong></a> ·
  <a href="README.de.md">Deutsch</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.fr.md">Français</a>
</p>

<p align="center">
  <img src="docs/images/vidselector-hero.png" alt="Abstract VidSelector banner with movie cards and a personal recommendation path" width="100%">
</p>

<h1 align="center">VidSelector</h1>

<p align="center">
  <strong>A private, self-hosted movie and TV recommendation app with explainable recommendations and no user tracking.</strong>
</p>

<p align="center">
  <a href="https://github.com/DevMatze/VidSelector/actions/workflows/ci.yml"><img src="https://github.com/DevMatze/VidSelector/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
  <img src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs" alt="Next.js 16">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5">
  <img src="https://img.shields.io/badge/SQLite-local-003B57?logo=sqlite" alt="Local SQLite database">
  <img src="https://img.shields.io/badge/use-personal%20%26%20non--commercial-ef4056" alt="Personal and non-commercial use">
</p>

![VidSelector dashboard](docs/images/dashboard.png)

VidSelector is a local web app for rating movies and TV shows and turning those ratings into personal recommendations. It uses one profile by default, with optional separate profiles for members of a household. There is no sign-in, advertising, external user tracking, or hosted VidSelector service: profiles and ratings stay in your own SQLite database.

> [!IMPORTANT]
> VidSelector is a personal, non-commercial hobby project. It is neither a streaming service nor a public multi-user platform.

## Why VidSelector?

- **Your own ratings:** `Like`, `Neutral`, or `Not for me`
- **Simple watchlist:** save or remove interesting titles with one click
- **Rule-based recommendations:** explainable scores instead of black-box AI
- **Movies and TV kept separate:** across categories, search, and library
- **Netflix-style navigation:** carousels, dynamic arrows, and dedicated “See more” pages
- **Anime as a separate facet:** Japanese animation is distinguished from Western animation
- **Rich details:** cast, creative team, runtime, seasons, trailers, and similar titles
- **Streaming information for Germany:** separated into streaming, rental, and purchase options
- **Local-first cache:** SQLite is queried before TMDB
- **Local data protection:** versioned export, validated import, and automatic backups
- **Demo mode:** try the app without API credentials
- **Responsive UI:** designed for desktop and mobile
- **Multilingual interface:** German, English, Spanish, and French per profile
- **Optional profile management:** separate local profiles without cloud accounts or sign-in
- **Validated YAML configuration:** server, recommendations, backups, logging, and feature flags

## Quick start

### Requirements

- Node.js 20 or newer (CI uses Node.js 22)
- npm
- optional: free TMDB API access for the full catalog

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

Open [http://localhost:3000](http://localhost:3000) on the computer. Without TMDB credentials, VidSelector automatically uses its built-in demo catalog.

`npm run setup` applies database migrations and creates a small example profile. For an empty start, use:

```bash
npm run db:push
```

## How recommendations work

VidSelector does not train an AI or machine-learning model. Recommendations are produced locally through transparent, rule-based weighting:

```text
Ratings
   │
   ├── genres and anime facet
   ├── original language and decade
   ├── cast and creative team
   └── similar positively/negatively rated titles
            │
            ▼
       weighted score
            │
            ▼
   diversified recommendations
```

Public rating, vote count, and popularity provide additional quality signals. Rated titles are excluded, while negative patterns actively lower the score of similar candidates. Repeated impressions, cautiously weighted clicks, and explicitly skipped titles improve rotation without replacing an actual rating. The central weights are defined in [`lib/recommendations/config.ts`](lib/recommendations/config.ts).

### Limited homepage, complete categories

- **Top picks for you:** up to 50 top movies plus 50 top TV shows by default
- **Movies for you:** up to 50 additional movies outside the top and discovery selections
- **TV shows for you:** up to 50 additional shows outside the top and discovery selections
- **Try something new:** up to 50 separate movie and TV discoveries by default

Movie and TV quotas are counted independently, but a title is assigned to only one section on the homepage. The related “See more” pages do not have the 50-title limit: they show the complete currently calculated recommendation pool for the selected category, initially 20 titles and then in batches of 20 by default. Both values can be changed in `config.yml`. Because these expanded views filter semantically rather than by homepage quotas, a strong title may appear in more than one suitable view.

### Ratings and watchlist

A rating describes your taste: “Like” strengthens similar attributes, “Not for me” weakens them, and “Neutral” stores the title without a positive or negative preference. The watchlist is independent and only saves interesting titles for later.

### Anime or animation?

TMDB does not list anime as its own genre. VidSelector therefore derives the facet from two explicit attributes:

```text
“Animation” genre + Japanese original language = Anime
```

This separates Japanese anime series from Western animated productions. The intentionally simple heuristic may differ for international co-productions.

## Privacy and security

- no online accounts or cloud synchronization
- no analytics, advertising, or tracking services
- server-side TMDB authentication
- origin checks for write API requests
- rate limits on API-intensive routes
- local, validated data exports and backups
- security headers

Profiles, ratings, watchlists, recommendation history, and anonymous recommendation interaction signals are stored locally in SQLite. TMDB credentials remain on the Next.js server and must never be committed to Git or included in screenshots.

Please do not report security issues through a public issue. Follow [`SECURITY.md`](SECURITY.md) instead.

## Limitations and threat model

- VidSelector provides no movies, TV shows, or streams itself.
- Streaming availability is supplied by TMDB/JustWatch, is focused on Germany, and may change.
- The app has no authentication or access control. Every device that can reach port 3000 can select profiles and change their data.
- Local profiles are a convenience for a trusted household network, not secure user accounts.
- Do not configure router port forwarding or use VidSelector on a public or untrusted Wi-Fi network.
- Public deployment would first require real authentication, TLS, and an independent security review.
- The source is publicly visible but is not licensed as open source; see [License](#license).

## Full installation and configuration

### Access from the local network

The development server also listens on the local network. If your computer and phone use the same Wi-Fi, open a URL such as `http://192.168.0.242:3000` on the phone, replacing the address with the computer's actual LAN IP. On Linux, `hostname -I` can display it.

If the page is unreachable, verify that both devices are on the same network and that the local firewall permits incoming TCP connections to port 3000 from the private network. Router port forwarding is neither required nor recommended.

### Enable TMDB

For the full catalog:

1. Create API credentials in [TMDB API Settings](https://www.themoviedb.org/settings/api).
2. Open `.env` and preferably enter the v4 Read Access Token.
3. Set `catalog.force_demo: false` in `config.yml` and restart the server.

```dotenv
TMDB_BEARER_TOKEN=
TMDB_API_KEY=
DATABASE_URL="file:./dev.db"
```

The classic `TMDB_API_KEY` is supported as an alternative. Both credentials remain exclusively on the Next.js server.

### Configuration

`config.example` documents every available setting in German. Copy it to `config.yml`; the local file is excluded from Git. Invalid values, unknown options, or incorrect types stop server startup with a clear error instead of being silently ignored.

Available settings include:

- listening address and port
- default language for new profiles; the selected language is then stored per profile
- `simple` mode for one user or `multiple` for local profile management
- forced demo catalog
- homepage limit, loading batch size, and recommendation explanations
- backup directory, triggers, and retention
- log level, request logging, and an optional log file
- profile import/export, streaming providers, trailers, and similar titles

Credentials and `DATABASE_URL` deliberately remain in `.env`. Feature flags disable both the visible UI and the related API routes or external requests.

The default is simple single-user mode:

```yaml
users:
  mode: "simple"
```

With `mode: "multiple"`, a profile switcher and management page become available. Each user gets a separate media cache, ratings, recommendations, watchlist, language, import/export data, and profile backups.

### Run as a local service

After the production build, VidSelector can run as a systemd user service:

```bash
npm run build
./scripts/install-service.sh
```

Common service commands are then available:

```bash
systemctl --user status vidselector
systemctl --user restart vidselector
journalctl --user -u vidselector -f
```

The service uses `server.host` and `server.port` from `config.yml` (`0.0.0.0:3000` by default), so it remains available through `http://localhost:3000` and `http://<computer-LAN-IP>:3000` on the trusted home network.

### Local cache and data storage

| Content                  |             Retention |
| ------------------------ | --------------------: |
| Search results           |              24 hours |
| Detail and provider data |                7 days |
| General media data       |               30 days |
| All TMDB content         | no more than 180 days |

Expired unused media is deleted. If a title is still linked to a personal rating, the rating remains while expired TMDB metadata is removed and fetched again on the next detail request. This preserves your profile without caching TMDB content for more than six months.

The following are not stored in Git:

- `.env` and API credentials
- `config.yml` with local settings
- `prisma/dev.db` with profiles and ratings
- build, coverage, and test artifacts
- `node_modules`
- local backups under `backups/`

### Export, import, and backups

Under **Settings → Backup**, you can export the profile name, profile language, ratings, and watchlist as a versioned JSON file. Import supports merging or complete replacement. VidSelector creates an additional local backup before an import or profile reset.

By default, `npm run db:push` also creates a consistent SQLite backup before every migration. Directory, triggers, and retention are controlled through `config.yml`. The defaults retain ten database backups, seven daily profile backups, and up to four older weekly profile snapshots. These files never leave your computer.

## Development

### Quality checks

```bash
npm run lint
npm run typecheck
npm run format:check
npm test
npm run test:coverage
npm run test:e2e
npm run build
```

GitHub Actions automatically runs linting, type checking, formatting checks, coverage, the production build, and desktop and mobile browser tests.

### Architecture

```text
app/                    Next.js pages and internal API routes
components/             responsive React components
lib/tmdb.ts             server-side TMDB integration
lib/media-cache.ts      query, media, and detail cache
lib/data.ts             Prisma persistence and local profile
lib/recommendations/    profile building, ranking, and diversification
lib/profile-transfer.ts versioned export and import format
lib/profile-backups.ts  automatic local profile backups
lib/config.mjs          validated YAML configuration
lib/i18n.ts             extensible UI translations
prisma/                 SQLite schema, migrations, and seed
tests/e2e/              Playwright smoke tests
deploy/                 systemd service template
```

### Commands

| Command                 | Purpose                                    |
| ----------------------- | ------------------------------------------ |
| `npm run dev`           | Start the development server               |
| `npm run build`         | Create a production build                  |
| `npm run start`         | Start the local production server          |
| `npm run setup`         | Apply migrations and add example data      |
| `npm run db:push`       | Apply Prisma migrations                    |
| `npm run db:backup`     | Create a consistent SQLite backup          |
| `npm run db:migrate`    | Migrate without the additional backup step |
| `npm run db:seed`       | Create the example profile                 |
| `npm run lint`          | Run ESLint                                 |
| `npm run typecheck`     | Check TypeScript                           |
| `npm test`              | Run unit, API, and component tests         |
| `npm run test:coverage` | Create a coverage report                   |
| `npm run test:e2e`      | Run desktop and mobile browser tests       |
| `npm run format`        | Format files with Prettier                 |

## Contributing

Focused improvements and reproducible bug reports are welcome. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request, follow the [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md), and report vulnerabilities privately as described in [`SECURITY.md`](SECURITY.md).

## Development transparency

VidSelector was designed, implemented, tested, and documented with the support of generative AI, particularly **OpenAI Codex**. Architecture decisions, selection of changes, technical review, and responsibility for the published version remain with the maintainer. The recommendation system itself does not use generative AI and sends no personal taste data to an AI service.

All published changes are documented in [`CHANGELOG.md`](CHANGELOG.md).

## Data sources, trademarks, and legal notices

This product uses the TMDB API but is not endorsed or certified by TMDB.

Movie and TV data and related images come from [The Movie Database (TMDB)](https://www.themoviedb.org). The TMDB logo used in the app is an official, unmodified logo and is displayed less prominently than VidSelector's own branding.

Streaming availability is provided through TMDB and originates from its partnership with **JustWatch**. Availability may change; VidSelector links to the page supplied by TMDB for further information.

Use of the TMDB API is always subject to the current [TMDB API Terms of Use](https://www.themoviedb.org/api-terms-of-use). Everyone running an instance needs their own TMDB credentials and is responsible for complying with those terms. This project is not intended for commercial use, which may require a separate written agreement with TMDB.

VidSelector does not provide movies, TV shows, or streams. All trademarks, titles, images, and other content remain the property of their respective owners.

## License

The source code is publicly viewable but is not licensed as open source. [`LICENSE.md`](LICENSE.md) applies: **All Rights Reserved**.

Copyright © 2026 DevMatze.
