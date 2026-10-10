# Production image: builds the Ember client, then bakes it into the Rails API's
# public/ so one dyno serves both. Used by Heroku (heroku.yml) and runnable locally:
#   docker build -t euclip . && docker run --rm -p 3000:3000 -e PORT=3000 \
#     -e RAILS_MASTER_KEY=... -e DATABASE_URL=... euclip

# ---------- 1. build the Ember client ----------
FROM node:18-bookworm-slim AS client
WORKDIR /client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npx ember build --environment=production

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
COPY --from=client /client/dist/ ./public/
# Heroku injects $PORT; the web command lives in heroku.yml.
EXPOSE 3000
CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]
