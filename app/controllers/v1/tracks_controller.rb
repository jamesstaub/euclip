class V1::TracksController < V1::BaseController
  respond_to :json
  before_action :set_track, only: %i[show update destroy]
  before_action :set_project, only: %i[create bulk]

  def show
    render json: TrackSerializer.new(@track), status: :ok
  end

  def create
    if can? :update, @project
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
        render_unprocessable_entity(@track.errors)
      end
    else
      render_forbidden("user: #{current_user.id} cannot create track for project: #{@project.slug}")
    end
  end

  def duplicate
    if can? :update, @project
      # eventually this could support copying a track between projects
      @track = Track.dup_with_relations({project_id: @project.id, duplicate_id: params[:duplicate_id]})
      if @track.save
        # when duplicating, we serialize all tracks for this project because the track orders will be updated
        render json: TrackSerializer.new(
          @track.project.tracks,
          { 
            include: included_relations,
            # no need to pass related models to client for anything other than
            # the duplicated track, only the track orders have been updated on others
            params: {relations_only_for: @track },
            # pass the ID of the newly created track in the {meta} to client so ember track adapter can
            # differentiate from the rest of the tracks that are retunrned in this case
            meta: { created: @track.id }
          }
        ), status: :ok
      else
        render_unprocessable_entity(@track.errors)
      end
    end
  end

def bulk
  if can? :update, @project
    # Extract file paths from the JSON API payload
    file_paths = params[:data]&.map { |track_data| track_data[:attributes][:filepath] }&.compact
    
    if file_paths.blank?
      return render json: { error: "No file paths provided" }, status: :bad_request
    end
    
    @tracks = Track.create_many_from_filepaths!(@project, file_paths)
    if @tracks.all?(&:persisted?)
      render json: TrackSerializer.new(
        @tracks,
        include: included_relations
      ), status: :ok
    else
      render_unprocessable_entity(@tracks.flat_map(&:errors))
    end
  else
    render_forbidden("user: #{current_user.id} cannot create track for project: #{@project.slug}")
  end
end

  def update
    if can? :update, @project
      @track.update(cleaned_params)
      if @track.save
        render json: TrackSerializer.new(
          @track,
          include: included_relations
        ), status: :ok
      else
        render_unprocessable_entity(@track.errors)
      end
    end
  end

  def destroy
    if can? :update, @project
      project = @track.project
      @track.destroy
      project.reorder_tracks!

      render json: TrackSerializer.new(
        project.tracks
      )
    else
      render_forbidden
    end
  end

  private
  
  def cleaned_params
    @attributes.permit(:order)
  end

  def set_track
    track = Track.includes(:project).find(params[:id])
    raise ActiveRecord::RecordNotFound unless track.present?
    # bare minimum permissions check before setting track attribute
    return render_forbidden() unless can? :view, track.project
    @track = track
    @project = track.project
  end

  def set_project
    project_slug = params.require(:project_slug)
    project = Project.includes(:tracks).find_by(slug: project_slug, creator_id: current_user.id)
    raise ActiveRecord::RecordNotFound unless project.present?
    return render_forbidden() unless can? :view, project
    @project = project
  end
end