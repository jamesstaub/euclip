class ApplicationController < ActionController::API
  include Pagy::Backend
  include ActionController::MimeResponds
  respond_to :json

  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found

  private

  def record_not_found(exception)
    render json: { error: exception.to_s }, status: :not_found
  end

  # parse the include?[model-name] query param 
  # map into format expected by serialzer for :include option
  def included_relations
    relations = params["include"]
    if relations.present?
      relations.split(',').map(&:underscore).map(&:to_sym)
    end
  end
end
