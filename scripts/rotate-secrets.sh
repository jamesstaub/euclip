#!/usr/bin/env bash
#
# Rotate the Rails secrets stored in server/config/credentials.yml.enc and
# the Rails master key, without ever printing a secret value.
#
#   scripts/rotate-secrets.sh                 # rotate locally
#   scripts/rotate-secrets.sh --heroku euclip # ...and push the new master key to Heroku
#   scripts/rotate-secrets.sh --rotate-pepper # ALSO rotate the devise pepper (see below)
#
# What is rotated
#   devise.secret_key, devise.jwt_secret_key, secret_key_base (if present),
#   and the master key that encrypts credentials.yml.enc.
#   Effect: every logged-in user is signed out (JWTs are re-signed), pending
#   password-reset emails stop working. Existing passwords keep working.
#
# What is NOT rotated unless you ask
#   devise.pepper. Passwords are hashed with the pepper, so rotating it makes
#   EVERY existing password invalid (users would need a reset). --rotate-pepper
#   requires typing a confirmation.
#
# How secrets stay hidden
#   * decryption/encryption happens inside a throwaway ruby container with only
#     server/config mounted; values are never written to stdout/stderr
#   * the Heroku step sends the key to the API through stdin / process
#     substitution, so it never appears in `ps` output or shell history
#   * the only output is key *names* and ok/failed status
#
# Requirements: docker (uses the ruby:3.2.8-slim image), and for --heroku,
# the heroku CLI (logged in), curl and python3.
#
# After running
#   1. commit server/config/credentials.yml.enc
#   2. deploy (the app needs the NEW master key set as RAILS_MASTER_KEY: the
#      --heroku flag does this; do it right before you deploy the new commit)
#   3. once verified, delete server/config/.rotation-backup-*  (it holds the OLD key)
#   4. manually rotate anything this script cannot reach (Discord client
#      secret in the Discord developer portal, DB password, etc.)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="${SERVER_DIR:-$ROOT/server}"
RUBY_IMAGE="${RUBY_IMAGE:-ruby:3.2.8-slim}"
HEROKU_APP=""
ROTATE_PEPPER=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --heroku) HEROKU_APP="${2:?--heroku needs an app name}"; shift 2 ;;
    --rotate-pepper) ROTATE_PEPPER=1; shift ;;
    -h|--help) sed -n '2,40p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

command -v docker >/dev/null || { echo "docker is required" >&2; exit 1; }
[[ -f "$SERVER_DIR/config/credentials.yml.enc" ]] || { echo "missing $SERVER_DIR/config/credentials.yml.enc" >&2; exit 1; }
[[ -f "$SERVER_DIR/config/master.key" ]] || { echo "missing $SERVER_DIR/config/master.key (the current key)" >&2; exit 1; }

if [[ $ROTATE_PEPPER -eq 1 ]]; then
  echo "WARNING: rotating the pepper invalidates every existing user password."
  read -r -p "Type 'invalidate passwords' to continue: " confirm
  [[ "$confirm" == "invalidate passwords" ]] || { echo "aborted"; exit 1; }
fi

umask 077
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$SERVER_DIR/config/.rotation-backup-$STAMP"
mkdir -p "$BACKUP"
cp "$SERVER_DIR/config/credentials.yml.enc" "$SERVER_DIR/config/master.key" "$BACKUP/"

echo "Rotating credentials (values are never printed)..."
docker run --rm -i \
  -e ROTATE_PEPPER="$ROTATE_PEPPER" \
  -v "$SERVER_DIR/config:/work/config" -w /work \
  "$RUBY_IMAGE" bash -c '
    gem install activesupport -v "~> 7.0.0" --no-document >/dev/null 2>&1 || { echo "could not install activesupport" >&2; exit 1; }
    ruby -
  ' <<'RUBY'
require "active_support"
require "active_support/encrypted_configuration"
require "securerandom"
require "yaml"
require "fileutils"

CFG = "config/credentials.yml.enc"
OLD_KEY = "config/master.key"
NEW_KEY = "config/master.key.new"
ROTATE = { %w[devise secret_key] => 64, %w[devise jwt_secret_key] => 64, %w[secret_key_base] => 64 }
ROTATE[%w[devise pepper]] = 64 if ENV["ROTATE_PEPPER"] == "1"

def enc(key_path) =
  ActiveSupport::EncryptedConfiguration.new(
    config_path: CFG, key_path: key_path, env_key: "UNUSED_ENV_KEY", raise_if_missing_key: true
  )

old_text = enc(OLD_KEY).read
abort "could not decrypt credentials with config/master.key" if old_text.to_s.empty?
data = YAML.safe_load(old_text, permitted_classes: [Symbol], aliases: true) || {}

rotated, skipped = [], []
ROTATE.each do |path, bytes|
  parent = path[0..-2].reduce(data) { |h, k| h.is_a?(Hash) ? h[k] : nil }
  if parent.is_a?(Hash) && parent.key?(path.last)
    parent[path.last] = SecureRandom.hex(bytes)
    rotated << path.join(".")
  else
    skipped << path.join(".")
  end
end
abort "nothing to rotate (expected devise.secret_key / devise.jwt_secret_key)" if rotated.empty?

File.write(NEW_KEY, SecureRandom.hex(16))
File.chmod(0o600, NEW_KEY)
FileUtils.cp(CFG, "#{CFG}.old")
begin
  enc(NEW_KEY).write(YAML.dump(data))
  check = YAML.safe_load(enc(NEW_KEY).read, permitted_classes: [Symbol], aliases: true)
  old = YAML.safe_load(old_text, permitted_classes: [Symbol], aliases: true)
  rotated.each do |p|
    keys = p.split(".")
    a = keys.reduce(old) { |h, k| h[k] }
    b = keys.reduce(check) { |h, k| h[k] }
    abort "verification failed for #{p}" if a == b || b.to_s.empty?
  end
  FileUtils.mv(NEW_KEY, OLD_KEY)
  File.chmod(0o600, OLD_KEY)
  File.delete("#{CFG}.old")
rescue Exception => e
  FileUtils.mv("#{CFG}.old", CFG, force: true)
  File.delete(NEW_KEY) if File.exist?(NEW_KEY)
  abort "rotation failed, originals restored (#{e.class})"
end

puts "rotated: #{rotated.join(', ')}"
puts "not present (skipped): #{skipped.join(', ')}" unless skipped.empty?
puts "other keys preserved: #{(data.keys - %w[devise secret_key_base]).join(', ')}"
puts "new master key written to config/master.key"
RUBY

# Plaintext copy of the old (now dead) secrets, if it still exists locally.
if [[ -f "$SERVER_DIR/credentials.yml" ]]; then
  rm -f "$SERVER_DIR/credentials.yml"
  echo "removed stale plaintext server/credentials.yml"
fi

if [[ -n "$HEROKU_APP" ]]; then
  command -v heroku >/dev/null && command -v curl >/dev/null && command -v python3 >/dev/null \
    || { echo "--heroku needs heroku, curl and python3" >&2; exit 1; }
  echo "Setting RAILS_MASTER_KEY on Heroku app '$HEROKU_APP' (via API, key not shown)..."
  TOKEN="$(heroku auth:token 2>/dev/null)"
  [[ -n "$TOKEN" ]] || { echo "heroku auth:token failed (run: heroku login)" >&2; exit 1; }
  status="$(
    python3 -c 'import json,sys; print(json.dumps({"RAILS_MASTER_KEY": open(sys.argv[1]).read().strip()}))' \
      "$SERVER_DIR/config/master.key" |
    curl -sS -o /dev/null -w '%{http_code}' -X PATCH \
      -K <(printf 'header = "Authorization: Bearer %s"\n' "$TOKEN") \
      -H 'Accept: application/vnd.heroku+json; version=3' \
      -H 'Content-Type: application/json' \
      --data @- "https://api.heroku.com/apps/$HEROKU_APP/config-vars"
  )"
  unset TOKEN
  [[ "$status" == "200" ]] && echo "Heroku config updated (HTTP 200)" || { echo "Heroku update failed (HTTP $status)" >&2; exit 1; }
  echo "Note: Heroku restarts the dyno on config change. Deploy the commit containing the new"
  echo "credentials.yml.enc immediately, or the app will fail to boot until you do."
fi

cat <<EOF

Done. Next:
  1. git add server/config/credentials.yml.enc && git commit
  2. $( [[ -z "$HEROKU_APP" ]] && echo "set the new RAILS_MASTER_KEY on Heroku (re-run with --heroku <app>), then" ) deploy
  3. after verifying, delete $BACKUP  (it contains the OLD master key)
  4. rotate manually: Discord client secret (Discord developer portal), database passwords
     for any exposed environments, and remove any remaining DISCORD_* vars:
       heroku config:unset DISCORD_CLIENT_ID DISCORD_CLIENT_SECRET -a <app>
EOF
