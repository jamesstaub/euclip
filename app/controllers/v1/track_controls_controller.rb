class V1::TrackControlsController < V1::BaseController
  before_action :set_models, only: %i[show update destroy]
  before_action :set_relations, only: %i[create]
  before_action :authorize_writes, only: %i[create update destroy]

  def show
    render json: TrackControlSerializer.new(@track_control), status: :ok
  end
  
  def create
    @track_control = TrackControl.new(clean_params)
    if @track_control.save
      render json: TrackControlSerializer.new(
        @track_control,
        include: included_relations
      ), status: :ok
    else
      render_unprocessable_entity(@track_control.errors)
    end
  end

  def update
    @track_control.update(clean_params)
    if @track_control.save
      render json: TrackControlSerializer.new(
        @track_control,
        include: included_relations
      ), status: :ok
    else
      render_unprocessable_entity(@track_control.errors)
    end
  end

  def destroy
    @track_control.destroy
    render json: { meta: {} }, status: :ok
  end
  
  private

  def set_models
    track_control = TrackControl.includes(:track => :project).find(params[:id])

    raise ActiveRecord::RecordNotFound unless track_control.present? && 
                                                track_control.track.present? && 
                                                track_control.track.project.present?

    # bare minimum permissions check before setting track attribute
    return render_forbidden unless can? :view, track_control.track.project
    @track_control = track_control
    @track = track_control.track
    @project = track_control.track.project
  end
  
  def set_relations
    track = Track.includes(:project).find(@relationships[:track][:data][:id])
    raise ActiveRecord::RecordNotFound unless track.present?
    return render_forbidden unless can? :view, track.project
    @track = track
    @project = track.project
  end

  def authorize_writes
    return render_forbidden unless can? :update, @project
  end

  def clean_params
    # REFACTOR
    # should a track control ever have it's node attribute, node type or node order changed?
    # they may be create-only params
    attrs = @attributes.permit(:min, 
                               :max,
                               :step_size,
                               :default_value, 
                               :control_value, 
                               :interface_name,
                               :apply_hits_only,
                               :node_type, 
                               :node_attr, 
                               :node_order,
                               :control_string_value,
                               :current_unit_transform_idx,
                               :control_array_value => [],
                              )

    
    attrs.merge(track_id: @track.id).to_h.reject{|_, v| v.nil?}
  end
end
