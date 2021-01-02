# frozen_string_literal: true

class RegistrationsController < Devise::RegistrationsController
  include Deviseable
  include Avatarable

  before_action :configure_permitted_parameters, only: %i[create update]
  before_action ->{ authenticate_user!(force: true) }, only: %i[destroy_avatar destroy update]
  respond_to :json

  def update
    return render_current_password_required unless current_password_valid?

    resource.avatar.purge if params.dig(:user, :avatar)
    super
  end

  def destroy
    return render_current_password_required unless current_password_valid?

    raise StandardError unless resource.discard!
    destroy_all_allowed_sessions
    render json: { message: 'User was successfully deactivated.' }, status: :ok
  rescue StandardError => e
    message = {
      error: "There was an error deactivating user ID: #{resource.id}.
      #{add_standard_error_message_if_valid(e.message)}".squish
    }
    render_error_message(message)
  end

  def destroy_avatar
    return render_avatar_not_found unless current_user.has_avatar?
    return render_current_password_required unless current_password_valid?

    current_user.avatar.purge
    if !current_user.has_avatar?
      render json: { message: 'Avatar was successfully deleted.' }, status: :ok
    else
      render json: { error: 'The server was unable to delete the avatar.' }, status: :internal_server_error
    end
  end

  private

  def render_current_password_required
    render json: { error: 'The current_password is missing or incorrect.' }, status: :unprocessable_entity
  end

  def destroy_all_allowed_sessions
    set_user_id if @user_id.blank?
    AllowlistedJwt.where(user_id: @user_id).delete_all
  end

  def respond_with(resource, _opts = {})
    if resource.errors.any?
      render json: { errors: resource.errors.full_messages.uniq }, status: :unprocessable_entity
    else
      render json: UserSerializer.new(resource).to_hash, status: :created
    end
  end

  def current_password_valid?
    return false if params.dig(:user, :current_password).blank?

    current_user.valid_password?(params.dig(:user, :current_password))
  end

  protected

  def configure_permitted_parameters
    reg_keys = %i[avatar email username]
    devise_parameter_sanitizer.permit(:sign_up, keys: reg_keys)
    devise_parameter_sanitizer.permit(:account_update, keys: reg_keys)
  end

  def sign_up_params
    params.require(:data).require(:attributes).permit(:username, :email, :password, :avatar)
  end
end
