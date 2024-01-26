class ApplicationController < ActionController::API
  include Pagy::Backend
  include ActionController::MimeResponds

  respond_to :json

  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found

  private

  def render_unprocessable_entity(errors)
    errors = errors.details.map do |attribute, details|
      {
        detail: details.first[:error],
        source: {
          pointer: "data/attributes/#{attribute}"
        }
      }
    end

    render json: { errors: errors }, status: :unprocessable_entity

  end


  def render_not_found(exception = nil)
    render json: { error: exception.to_s }, status: :not_found
  end

  def render_unauthorized
    render json: { error: 'Unauthorized' }, status: :unauthorized
  end
end
