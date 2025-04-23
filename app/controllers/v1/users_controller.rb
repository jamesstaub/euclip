# frozen_string_literal: true

class V1::UsersController < ApplicationController
  include Avatarable

  before_action :log_headers
  before_action :authenticate_user!
  before_action :set_user, only: %i[avatar show]

  def avatar
    return render_avatar_not_found unless @user.has_avatar?

    redirect_to rails_representation_url(
      @user.avatar.variant(resize: '150x150').processed,
      only_path: true
    )
  end

  def index
    @pagy, @users = pagy(User.kept.order(created_at: :asc))
    render json: UserSerializer.new(
      @users,
      { meta: { pagination: pagy_metadata(@pagy) } }
    ), status: :ok
  end

  def show
    render json: UserSerializer.new(@user).to_hash, status: :ok
  end

  private

  def set_user
    @user = User.find(params[:id])
  end

  def log_headers
    Rails.logger.info("TOKENEXISTS? ")
    token = request.headers['Authorization']&.split(' ')&.last
    decoded_token = JWT.decode(token, Rails.application.credentials.devise[:jwt_secret_key], true, { algorithm: 'HS256' })
    Rails.logger.info("Decoded token: #{decoded_token}")
  end
end
