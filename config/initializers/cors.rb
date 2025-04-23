#  config/initializers/cors.rb

# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin AJAX requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins '*'
    resource '/public/*',
      headers: :any,
      methods: :get

    resource '*',
      headers: :any,
      expose: %w(Authorization),
      methods: %i(get patch put post delete options head)
  end

  allow do
    origins 'discord.com', 'discordapp.com', /.*\.discordsays\.com/ # Add Discord origins
    resource '*',
             headers: :any,
             methods: [:get, :post, :put, :patch, :delete, :options, :head],
             credentials: true # Allow cookies or Authorization headers
  end

  allow do
    origins 'localhost:4200' # Allow requests from the Ember app
    resource '*',
             headers: :any,
             expose: %w(Authorization),
             methods: %i[get post put patch delete options head]
  end
end
