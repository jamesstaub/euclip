.PHONY: setup dev db test test-server build-client docker-build rotate-secrets
setup:         ; bin/setup
dev:           ; bin/dev
db:            ; docker compose up -d db
test-server:   ; cd server && bundle exec rspec
test-e2e:      ; cd e2e && npm test
test: test-server
build-client:  ; bin/build-client
docker-build:  ; docker build -t euclip .
rotate-secrets: ; scripts/rotate-secrets.sh
docker-up:     ; docker compose up
docker-down:   ; docker compose down
