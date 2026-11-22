# Euclip

A browser-based drum machine / sequencer built on Euclidean rhythms and Web Audio.

| Directory | What | Stack |
|-----------|------|-------|
| [`client-v2/`](client-v2) | The web app | Ember (Vite + Embroider, TypeScript), the `cracked-up` Web Audio library |
| [`server/`](server) | JSON:API backend | Rails 7.0, Postgres, devise + devise-jwt |

In production one Heroku app serves both: the Docker image builds the client and
copies it into `server/public`, and Rails serves the SPA plus the `/v1` API.

## Prerequisites

Docker route: just Docker and `server/config/master.key`. The rest is for running natively (Option B).


- Node 22.15.0 (`nvm use` reads `.nvmrc`)
- The [`cracked-up`](https://github.com/jamesstaub/cracked-up) repo cloned next to this one (`../cracked-up`): `client-v2` depends on it as `file:../../cracked-up` until it is published to npm
- Ruby 3.2.8 (`server/.ruby-version`), e.g. with rvm:
  ```bash
  brew install libyaml libpq openssl@3
  rvm install 3.2.8 --with-openssl-dir="$(brew --prefix openssl@3)"
  rvm use 3.2.8 --default
  gem install bundler -v 2.4.19
  bundle config build.pg --with-pg-config="$(brew --prefix libpq)/bin/pg_config"
  ```
- Option B only: Postgres 15 (or `docker compose up -d db`)
- `server/config/master.key`: needed to decrypt `server/config/credentials.yml.enc`
  (devise/JWT secrets). Ask a teammate or your password manager; it is not in git.

## Local development

### Option A: Rails and Postgres in Docker

```bash
docker compose up        # Postgres + Rails on :3000
```

Needs `server/config/master.key`. Reset with `docker compose down -v`. Run the client natively (below).

### Option B: native (faster rebuilds)

```bash
bin/setup     # builds ../cracked-up, npm ci in client-v2, bundle install, creates server/.env, starts Postgres, db:prepare
bin/dev       # Rails on :3000 + the client (Vite) on :5173
```

`make setup`, `make dev`, `make test`, `make test-client` are shortcuts. The client dev server proxies the
sound library (`/v1/files`) to the deployed API (override with `EUCLIP_LIBRARY_HOST`); see `client-v2/vite.config.mjs`.

First run on an empty DB: `cd server && bundle exec rails db:seed` loads preset collections and
the sound-file index.

### Tests

```bash
cd server && bundle exec rspec     # Rails specs (needs Postgres + master.key); runs against the *_test database
cd client-v2 && npm run lint && npm test
```

## Production build and deploy

The root [`Dockerfile`](Dockerfile) is a two-stage build:

1. `node:22`: clones `cracked-up` at a pinned ref (`CRACKED_UP_REF`; interim until it is on npm), builds it, then `npm ci` and `npm run build` in `client-v2/`
2. `ruby:3.2.8`: `bundle install` for `server/`, then copies `client-v2/dist` into `public/`

Test it locally:

```bash
docker build -t euclip .
docker run --rm -p 3000:3000 -e PORT=3000 -e RAILS_MASTER_KEY=... -e DATABASE_URL=postgres://... euclip
```

Production forces HTTPS (`config.force_ssl`); put a TLS-terminating proxy in front when testing locally
or send `X-Forwarded-Proto: https`.

### Heroku (container stack)

[`heroku.yml`](heroku.yml) defines the build, the web process and a release phase that runs `rails db:migrate`.

One-time setup:

```bash
heroku stack:set container -a <app>
heroku addons:create heroku-postgresql -a <app>      # provides DATABASE_URL
heroku config:set RAILS_MASTER_KEY=... -a <app>      # or use scripts/rotate-secrets.sh --heroku <app>
```

Deploy: `git push heroku <branch>:main`.
Required config vars: `RAILS_MASTER_KEY`, `DATABASE_URL`. Optional: `CORS_ORIGINS` (comma-separated).
`RAILS_SERVE_STATIC_FILES` and `RAILS_LOG_TO_STDOUT` are already set in the image.
Verify the app has no leftover `DISCORD_*` config vars (`heroku config:unset DISCORD_CLIENT_ID DISCORD_CLIENT_SECRET`).

### Audio files and CORS (Google Cloud Storage)

Drum samples are fetched by the browser directly from the public bucket
`gs://euclidean-cracked.appspot.com`. The bucket must send CORS headers for your origins or sample
loads fail silently. The policy lives in [`infra/gcs-cors.json`](infra/gcs-cors.json):

```bash
gcloud auth login
gcloud storage buckets update gs://euclidean-cracked.appspot.com --cors-file=infra/gcs-cors.json
gcloud storage buckets describe gs://euclidean-cracked.appspot.com --format="default(cors_config)"   # verify
```

Add any new origin (staging domain, etc.) to that file and re-apply.

## Secrets

Rails credentials are encrypted in `server/config/credentials.yml.enc`; the key is `server/config/master.key`
(gitignored) or the `RAILS_MASTER_KEY` env var. To rotate them without printing any value:

```bash
scripts/rotate-secrets.sh                 # local only
scripts/rotate-secrets.sh --heroku <app>  # also push the new master key to Heroku (via API, not argv)
```

See the header of the script for exactly what is and isn't rotated (the devise pepper is excluded by
default because rotating it invalidates every password). It needs Docker.

## Tracks: types, sequences and files

A **track** is built from two scripts (setup and play, ordinary editable JavaScript), its sequences,
its sampler files and its controls.

- **Track types** (the "New Track" menu) live in [`server/app/models/track_type.rb`](server/app/models/track_type.rb):
  Sampler, Looped sampler (speed in *Loop Sync* units), Multi-sample kit (four samplers, one file each)
  and Polysynth (cracked's `polysynth` macro). Each is a set of starting scripts, sequences and control
  defaults that is *copied* onto the track on creation (`POST /v1/projects/:slug/tracks` with `track-type`;
  `GET /v1/track-types` lists them). To add a type, add an entry there; no migration needed. Control
  defaults (`"sampler.speed" => { unit: "Loop Sync" }`) are applied by the client once the audio exists.
- **Sequences**: a track has one or more, ordered by `order` (the primary one is the lowest and drives the
  step display). Each steps independently, and the play script receives its `sequenceIndex` (plus
  `this.sequences`). A control follows one sequence via `sequenceOrder`. API: `POST/PATCH/DELETE /v1/sequences`
  (a track always keeps one); client: `track.addSequence()`, `track.removeSequence(seq)`.
- **Files**: one `filepath_control` per *sampler slot* (`node_order`: 0 is the first sampler node, 1 the
  second...), unique per track. Scripts read them as `this.files[slot]`. Set one with `track.setFile(slot, path)`;
  concurrent picks are serialized so a slot never gets two controls.
- **Controls** (`track_controls`) belong to a node by (type, attribute, creation order) and hold the user's
  saved values. Rebuilding a track's audio re-links them and never overwrites them; only missing controls are created.

## The `cracked-up` audio library

The client depends on [`cracked-up`](https://github.com/jamesstaub/cracked-up) (a maintained fork's successor
to Bill Orcutt's `cracked`), linked from a sibling checkout (`file:../../cracked-up`) until it is published to npm.

## Repo layout notes

This repo was consolidated from two repos (`euclip` and `euclip-api`); history for both is preserved
(`git log --follow` works across the move). The pre-consolidation, pre-Discord-removal states are tagged
`pre-cleanup-discord` in the original repos.

## Licence

Euclip is free software under the GNU Affero General Public License, version 3 (see [LICENSE](LICENSE)).
The cracked-up audio library it is built on is a separate project under the MIT licence.
