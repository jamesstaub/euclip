class V1::TracksController < V1::BaseController
  respond_to :json
  before_action ->{ authenticate_user!(force: true) }, only: %i[create update]
  before_action :set_track, only: %i[show update destroy]
  before_action :set_project, only: %i[show create]

  def show
    render json: TrackSerializer.new(@track), status: :ok
  end

  def create
    @track = Track.create_with_relations({project_id: @project.id})
    if @track.save
      render json: TrackSerializer.new(
        @track,
        include: included_relations
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
    # and a Sequence model can contain properties for euclidean, custom, or other types of sequences
    @attributes.permit(:filepath, :hits, :steps, :offset, :custom_sequence)
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