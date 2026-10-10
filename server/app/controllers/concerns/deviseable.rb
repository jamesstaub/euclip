# frozen_string_literal: true

module Deviseable
  include ActiveSupport::Concern

  protected

  # :nocov:
  def add_standard_error_message_if_valid(message)
    message != 'StandardError' ? "Error: #{message}" : ''
  end

  def render_error_message(message)
    Rails.logger.error message.to_json
    render json: message, status: :internal_server_error and return
  end

  def set_payload
    set_token
    secret = Rails.application.credentials.devise[:jwt_secret_key]
    @payload = JWT.decode(@token, secret, true, algorithm: 'HS256', verify_jti: true).try(:first)
    @payload = HashWithIndifferentAccess.new @payload
  end

  def set_token
    @token = request.headers
      .select { |k,v| k == 'HTTP_AUTHORIZATION' }
      .flatten
      .try(:last)
      .try(:split, ' ')
      .try(:last)
  end

  def set_user_id
    set_payload if @payload.blank?
    @user_id = AllowlistedJwt.find_by(jti: @payload.try(:dig, :jti)).try(:user_id)
  end
  # :nocov:
end