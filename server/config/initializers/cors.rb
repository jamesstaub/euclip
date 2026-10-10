# Be sure to restart your server when you modify this file.
#
# The Ember app is normally served from this same origin (production) or proxied
# through `ember serve` (development), so CORS only matters for other origins.
# Override with CORS_ORIGINS="https://a.example,https://b.example".

allowed_origins = ENV.fetch("CORS_ORIGINS", "https://euclip.app,http://localhost:4200,https://localhost:4200").split(",").map(&:strip)

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*allowed_origins)
    resource '*',
      headers: :any,
      expose: %w(Authorization),
      methods: %i(get patch put post delete options head)
  end
end
