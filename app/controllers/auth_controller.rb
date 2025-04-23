class AuthController < ApplicationController
  before_action :authenticate_with_token

  def authenticate
    render json: { user: UserSerializer.new(@current_user).to_hash }, status: :ok
  end

  private

  def authenticate_with_token
    token = request.headers["Authorization"]&.split(" ")&.last
    return render_unauthorized unless token

    user_auth = UserAuth.find_by(access_token: token)
    return render_unauthorized unless user_auth

    @current_user = user_auth.user
  end

  def render_unauthorized
    render json: { error: "Unauthorized" }, status: :unauthorized
  end
end
