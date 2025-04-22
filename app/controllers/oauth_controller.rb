class OauthController < ApplicationController
  require 'net/http'
  require 'uri'
  require 'json'

  def token
    uri = URI.parse("https://discord.com/api/oauth2/token")
    request = Net::HTTP::Post.new(uri)
    request["Content-Type"] = "application/x-www-form-urlencoded"
    request.set_form_data(
      client_id: ENV["DISCORD_CLIENT_ID"],
      client_secret: ENV["DISCORD_CLIENT_SECRET"],
      grant_type: "authorization_code",
      code: params[:code]
    )

    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
      http.request(request)
    end

    if response.is_a?(Net::HTTPSuccess)
      body = JSON.parse(response.body)
      render json: { access_token: body["access_token"] }
    else
      render json: { error: "Failed to retrieve access token" }, status: :bad_request
    end
  end
end
