class V1::TracksController < V1::BaseController
  respond_to :json
  before_action :set_track, only: %i[show update destroy]
  before_action :set_project, only: %i[show create]

  def show
    render json: TrackSerializer.new(@track), status: :ok
  end

  def create
    if params[:duplicate_id]
      return duplicate
    end
    @track = Track.create_with_relations!({project_id: @project.id})
    if @track.save
      render json: TrackSerializer.new(
        @track,
        include: included_relations
      ), status: :ok
    else
      render json: { errors: @track.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  def duplicate
    # eventually this could support copying a track between projects
    @track = Track.dup_with_relations({project_id: @project.id, duplicate_id: params[:duplicate_id]})
    if @track.save
      # when dupliccating, we serialize all tracks for this project because the track orders will be updated
      render json: TrackSerializer.new(
        @track.project.tracks,
        { 
          include: included_relations,
          # no need to pass related models to client for anything other than
          # the duplicated track, only the track orders have been updated on others
          params: {relations_only_for: @track },
          # pass the ID of the newly created track in the {meat} to client so ember track adapter can
          # differentiate from the rest of the tracks that are retunrned in this case
          meta: { created: @track.id }
        }
      ), status: :ok
    else
      render json: { errors: @track.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  def update
    @track.update(cleaned_params)
    if @track.save
      render json: TrackSerializer.new(
        @track,
        include: included_relations
      ), status: :ok
    else
      render json: { errors: @track.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  def destroy
    project = @track.project
    @track.destroy
    project.reorder_tracks!

    render json: TrackSerializer.new(
      project.tracks
    )
  end

  private
  
  def cleaned_params
    # TODO: 
    # eventually filepath should be like any other TrackControl attribute
    @attributes.permit(:filepath)
  end

  def set_track
    @track = Track.find(params[:id])
  end

  def set_project
    project_slug = params.require(:project_slug)
    @project = Project.find_by(slug: project_slug)
    raise ActiveRecord::RecordNotFound unless @project.present?
  end
end