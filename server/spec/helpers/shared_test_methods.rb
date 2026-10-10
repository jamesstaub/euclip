# frozen_string_literal: true

module SharedTestMethods
  extend RSpec::SharedContext

  # :nocov:
  def logged_in?
    @current_user.present? && @auth.present?
  end

  def login_user
    @current_user = create(:user, :with_avatar)
    @user_json = UserSerializer.new(@current_user).to_hash
    post '/login', params: { user: { login: @current_user.username, password: '$Qwerty1' } }

    @auth = response.headers['Authorization']
    @token = @auth.split(' ')[1]
    @auth_header = { Authorization: @auth }
    @headers = @auth_header.merge({'Content-Type': APP_JSON, Accept:  APP_JSON })
  end

  def logout_user
    @auth_header = { Authorization: @auth }
    delete '/logout', params: { user: { current_password: '$Qwerty1' } }, headers: @auth_header

    @current_user = nil
    @user_json = nil
    @auth_header = nil
    @token = nil
    @headers = nil
  end

  def json_parse(json)
    Oj.load(json, symbol_keys: true)
  end

  def jwt_secret_key
    Rails.application.credentials.devise[:jwt_secret_key]
  end

  def jwt_payload
    login_user unless logged_in?
    JWT.decode(@token, jwt_secret_key, true, algorithm: 'HS256', verify_jti: true)[0]
  end

  def jwt_token(payload)
    JWT.encode(payload, jwt_secret_key)
  end

  def set_auth_with_bad_jti
    login_user unless logged_in?
    payload        = jwt_payload
    payload['jti'] = nil
    @auth          = "Bearer #{jwt_token(payload)}"
  end
  # :nocov:
end