# Euclip

A browser-based drum machine / sequencer built on Euclidean rhythms and Web Audio.

| Directory | What | Stack |
|-----------|------|-------|
| [`client/`](client) | The web app | Ember 5.5 (Octane + TypeScript), Embroider, the custom `cracked` Web Audio library (`client/vendor/cracked.min.js`) |
| [`server/`](server) | JSON:API backend | Rails 7.0, Postgres, devise + devise-jwt |

In production one Heroku app serves both: the Docker image builds the client and
copies it into `server/public`, and Rails serves the SPA plus the `/v1` API.

## Prerequisites

Docker route: just Docker and `server/config/master.key`. The rest is for running natively (Option B).


- Node 18 (`nvm use` reads `.nvmrc`)
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
- Optional, only for the Rust/WASM bitcrusher work: Rust + `wasm-pack`

## Local development

### Option A: everything in Docker (no Ruby/Node install needed)

```bash
docker compose up        # first run takes a couple of minutes (gems + npm + webpack)
```

Open http://localhost:4200. The compose file runs Postgres, Rails (`:3000`) and `ember serve` (`:4200`,
proxying API calls to Rails), with `client/` and `server/` bind-mounted so edits reload.
Gems and `node_modules` live in named volumes. The database is created and seeded on first start.
Needs `server/config/master.key`. Reset everything with `docker compose down -v`.

Useful: `docker compose exec -e RAILS_ENV=test server bundle exec rspec`, `docker compose exec server bundle exec rails console`,
`docker compose logs -f client`.

### Option B: native (faster rebuilds)

```bash
bin/setup     # npm ci, bundle install, creates server/.env, starts Postgres via docker, db:prepare
bin/dev       # Rails on :3000 + Ember on :4200 (open http://localhost:4200)
```

`ember serve` proxies API requests to Rails (`client/.ember-cli`), so there is no CORS or
SSL setup for local work. Shortcuts: `make setup`, `make dev`, `make test`.

First run on an empty DB: `cd server && bundle exec rails db:seed` loads preset collections and
the sound-file index.

### Tests

```bash
cd server && bundle exec rspec   # Rails specs (needs Postgres + master.key)
cd client && npm run lint
```

Status: the Rails suite has ~25 known failures (registration/session/user specs have drifted
from the code) and the Ember test suite is mostly generator stubs. The plan is to replace it with
end-to-end acceptance tests rather than fix it up.

### WASM bitcrusher (optional)

`npm run wasm:build` inside `client/` compiles `client/wasm` to `client/public/wasm` (needs
Rust + wasm-pack). It is no longer part of `npm install`, and the production image does not build it.

## Production build and deploy

The root [`Dockerfile`](Dockerfile) is a two-stage build:

1. `node:18`: `npm ci` and `ember build --environment=production` in `client/`
2. `ruby:3.2.8`: `bundle install` for `server/`, then copies the built client into `public/`

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

## The `cracked` audio library

The client depends on a custom fork of Bill Orcutt's `cracked`, built from
[`jamesstaub/i_dropped_my_phone_the_screen_cracked`](https://github.com/jamesstaub/i_dropped_my_phone_the_screen_cracked)
into `client/vendor/cracked.min.js`. Its `npm run build` currently moves the **unminified** bundle into
that path; see the project notes before relying on it.

## Repo layout notes

This repo was consolidated from two repos (`euclip` and `euclip-api`); history for both is preserved
(`git log --follow` works across the move). The pre-consolidation, pre-Discord-removal states are tagged
`pre-cleanup-discord` in the original repos.
