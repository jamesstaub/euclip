class OauthController < ApplicationController
  require 'net/http'
  require 'uri'
  require 'json'

  def token
    Rails.logger.info("Received request to token endpoint")
    render json: { access_token: 'fake-token-123' }, status: :ok
  end

  def authorize
    uri = URI.parse("https://discord.com/api/oauth2/authorize")
    params = {
      client_id: ENV["DISCORD_CLIENT_ID"],
      redirect_uri: ENV["DISCORD_REDIRECT_URI"],
      response_type: "code",
      scope: "identify email",
      state: SecureRandom.hex(16) # Optional: Use this to prevent CSRF attacks
    }
    uri.query = URI.encode_www_form(params)
    render json: { url: uri.to_s }, status: :ok
  end

  private

  def fetch_discord_user_info(access_token)
    uri = URI.parse("https://discord.com/api/v10/users/@me")
    request = Net::HTTP::Get.new(uri)
    request["Authorization"] = "Bearer #{access_token}"

    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
      http.request(request)
    end

    raise "Failed to fetch Discord user info" unless response.is_a?(Net::HTTPSuccess)

    JSON.parse(response.body)
  end
end
