class ApplicationController < ActionController::API
  include Pagy::Backend
  include ActionController::MimeResponds
  
  before_action :set_params, only: %i[create update]

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

  def set_params
    @data = params.require(:data)
    @type = @data.require(:type)
    @attributes = @data.require(:attributes)
    @relationships = @data.require(:relationships)
  end

  # REFACTOR track-related stuff into a different generic parent controller

  def get_related_track
    track_id = @relationships.require(:track).require(:data).require(:id)
    track = Track.find(track_id)
    raise ActiveRecord::RecordNotFound unless track.present?
    track
  end
end
