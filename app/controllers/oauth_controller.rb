class OauthController < ApplicationController
  require 'json'
  include Devise::Controllers::Helpers

  def token
    access_token = fetch_token(params[:code])
    render json: { access_token: access_token }, status: :ok
  rescue Net::OpenTimeout, Net::ReadTimeout => e
    Rails.logger.error("Request to Discord timed out: #{e.message}")
    render_gateway_timeout("Request to Discord timed out: #{e.message}")
  rescue StandardError => e
    Rails.logger.error("Error in token endpoint: #{e.message}")
    render json: { errors: e.message }, status: :unprocessable_entity
  end

  def authenticate
    # Extract the access token from the Authorization header
    access_token = request.headers['Authorization']&.split(' ')&.last
    raise ArgumentError, "Missing access token" unless access_token.present?

    # Fetch user info from Discord and create or update the user
    user_info = fetch_discord_user_info(access_token)
    user = DiscordUserService.create_or_update_user(user_info, access_token)

    if user.persisted?
      # Generate a JWT token using Devise-JWT
      token, _payload = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil)

      # Log the token and ensure it is added to the allowlist
      Rails.logger.info("Generated JWT: #{token}")

      # Set the current_user using Devise's sign_in method
      sign_in(user)

      # Return the token and user info to the client
      render json: {
        token: token,
        user: UserSerializer.new(user).to_hash
      }, status: :ok
    else
      render json: { error: 'Failed to authenticate user with Discord.' }, status: :unauthorized
    end
  rescue ArgumentError => e
    render json: { errors: e.message }, status: :unprocessable_entity
  rescue StandardError => e
    Rails.logger.error("Authentication failed: #{e.message}")
    render json: { error: "An error occurred during authentication. #{e.message}" }, status: :internal_server_error
  end

  private

  def fetch_token(code)
    uri = URI.parse("https://discord.com/api/oauth2/token")
    form_data = {
      client_id: ENV["DISCORD_CLIENT_ID"],
      client_secret: ENV["DISCORD_CLIENT_SECRET"],
      grant_type: "authorization_code",
      code: code
    }

    response_body = HttpService.post(uri, headers: { "Content-Type" => "application/x-www-form-urlencoded" }, form_data: form_data)

    response_body["access_token"]
  end

  def fetch_discord_user_info(access_token)
    uri = URI.parse("https://discord.com/api/v10/users/@me")
    response_body = HttpService.get(uri, headers: { "Authorization" => "Bearer #{access_token}" })

    Rails.logger.info("Fetched Discord user info: #{response_body}")
    response_body
  rescue StandardError => e
    Rails.logger.error("Error fetching Discord user info: #{e.message}")
    render_not_found("Failed to fetch Discord user info")
  end
end
