class V1::TrackControlsController < V1::BaseController
  before_action :set_track, only: %i[create update]
  before_action :set_track_control, only: %i[show update destroy]

  # TODO:
  # enforce proper permissions for these endpoints

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

  def set_track_control
    @track_control = TrackControl.find(params[:id])
  end

  def set_track
    # TODO validate track
    @track = Track.find(@relationships.require(:track)[:data][:id])
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
                               :node_type, 
                               :node_attr, 
                               :node_order,
                               :control_string_value,
                               :current_unit_transform_idx,
                               :control_array_value => [],
                              )

    
    attrs.merge(track_id: @track.id).to_h.reject{|_, v| v.blank?}
  end
end
