require 'puma'
# Puma configuration file.

max_threads_count = ENV.fetch("RAILS_MAX_THREADS") { 5 }
min_threads_count = ENV.fetch("RAILS_MIN_THREADS") { max_threads_count }
threads min_threads_count, max_threads_count

if ENV.fetch("RAILS_ENV", "development") == "production"
  port ENV.fetch("PORT") { 3000 } # Heroku provides $PORT
end

environment ENV.fetch("RAILS_ENV") { "development" }

pidfile ENV.fetch("PIDFILE") { "tmp/pids/server.pid" }

workers ENV.fetch("WEB_CONCURRENCY") { ENV.fetch("RAILS_ENV", "development") == "production" ? 2 : 0 }

preload_app!

plugin :tmp_restart

# Development: plain HTTP on :3000 (ember serve proxies to it).
# Set SSL=1 (after `scripts/generate-ssl.sh`) to serve https locally instead.
if ENV.fetch("RAILS_ENV", "development") == "development"
  if ENV["SSL"] == "1"
    ssl_bind '127.0.0.1', '3000', {
      key: File.expand_path("ssl/server.key", __dir__),
      cert: File.expand_path("ssl/server.crt", __dir__),
      verify_mode: 'none'
    }
  else
    port ENV.fetch("PORT") { 3000 }
  end
end
