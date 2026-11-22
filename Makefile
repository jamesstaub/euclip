.PHONY: setup dev db test test-server build-client docker-build rotate-secrets
setup:         ; bin/setup
dev:           ; bin/dev
db:            ; docker compose up -d db
test-server:   ; cd server && RAILS_ENV=test bundle exec rspec
test-client:   ; cd client-v2 && npm run lint && npm test
test: test-server
build-client:  ; cd client-v2 && npm run build
docker-build:  ; docker build -t euclip .
rotate-secrets: ; scripts/rotate-secrets.sh
docker-up:     ; docker compose up
docker-down:   ; docker compose down
