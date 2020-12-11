class V1::TracksController < ApplicationController
  before_action ->{ authenticate_user!(force: true) }, only: %i[create update]
  before_action :set_project

  def create
    @track = Track.create_with_relations({project_id: @project.id})
    if @track.save
      render json: TrackSerializer.new(
        @track
      ), status: :ok
    else
      render json: { errors: @track.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  private 

  def set_project
    project_slug = params.require(:project_slug)
    @project = Project.find_by(slug: project_slug)
    raise ActiveRecord::RecordNotFound unless @project.present?
  end

end