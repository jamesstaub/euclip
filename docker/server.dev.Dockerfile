# Development image for the Rails API (gems live in a named volume; code is bind-mounted).
FROM ruby:3.2.8
RUN apt-get update -qq \
 && apt-get install -y --no-install-recommends libpq-dev libyaml-dev postgresql-client \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV BUNDLE_PATH=/bundle BUNDLE_JOBS=4
