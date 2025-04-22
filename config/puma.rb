require 'puma'
# Puma configuration file.

max_threads_count = ENV.fetch("RAILS_MAX_THREADS") { 5 }
min_threads_count = ENV.fetch("RAILS_MIN_THREADS") { max_threads_count }
threads min_threads_count, max_threads_count

# port ENV.fetch("PORT") { 3000 }

environment ENV.fetch("RAILS_ENV") { "development" }

pidfile ENV.fetch("PIDFILE") { "tmp/pids/server.pid" }

workers ENV.fetch("WEB_CONCURRENCY") { 2 }

preload_app!

plugin :tmp_restart

# SSL binding for development only
if ENV.fetch("RAILS_ENV", "development") == "development"
  ssl_bind '0.0.0.0', '3000', {
    key: File.expand_path("ssl/server.key", __dir__),
    cert: File.expand_path("ssl/server.crt", __dir__),
    verify_mode: 'none'
  }
end
