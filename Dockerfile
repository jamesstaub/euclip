# Production image: builds the client, then bakes it into the Rails API's
# public/ so one dyno serves both. Used by Heroku (heroku.yml) and runnable locally:
#   docker build -t euclip . && docker run --rm -p 3000:3000 -e PORT=3000 \
#     -e RAILS_MASTER_KEY=... -e DATABASE_URL=... euclip

# ---------- 1. build the client (client-v2: Vite + Embroider) ----------
FROM node:22-bookworm-slim AS client
RUN apt-get update -qq && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/*
# INTERIM, until cracked-up is published to npm: client-v2 depends on "file:../../cracked-up", a sibling
# of the repo, which the build context cannot see. Clone it at a pinned ref beside the app and build it.
ARG CRACKED_UP_REPO=https://github.com/jamesstaub/cracked-up.git
ARG CRACKED_UP_REF=2f70ab2194055cc31e8d06015e41c4e85e8e3096
WORKDIR /src
RUN git init cracked-up && cd cracked-up \
 && git remote add origin "$CRACKED_UP_REPO" \
 && git fetch --depth 1 origin "$CRACKED_UP_REF" \
 && git checkout --detach FETCH_HEAD \
 && npm ci && npm run build
# From /src/euclip/client-v2, ../../cracked-up resolves to /src/cracked-up.
WORKDIR /src/euclip/client-v2
COPY client-v2/package.json client-v2/package-lock.json ./
RUN npm ci
COPY client-v2/ ./
RUN npm run build

# ---------- 2. Rails API + built client ----------
FROM ruby:3.2.8-slim AS app
RUN apt-get update -qq \
 && apt-get install -y --no-install-recommends build-essential libpq-dev libyaml-dev git curl \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV RAILS_ENV=production \
    RAILS_SERVE_STATIC_FILES=1 \
    RAILS_LOG_TO_STDOUT=1 \
    BUNDLE_DEPLOYMENT=1 \
    BUNDLE_WITHOUT=development:test
COPY server/Gemfile server/Gemfile.lock ./
RUN bundle install --jobs 4
COPY server/ ./
RUN mkdir -p tmp/pids log storage
COPY --from=client /src/euclip/client-v2/dist/ ./public/
# Heroku injects $PORT; the web command lives in heroku.yml.
EXPOSE 3000
CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]
