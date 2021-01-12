class V1::TrackControlsController < V1::BaseController
  before_action :set_track, only: %i[create update]
  before_action :set_track_control, only: %i[show update destroy]

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
      render json: { errors: @track_control.errors.full_messages.join(', ') }, status: :unprocessable_entity
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
      render json: { errors: @track_control.errors.full_messages.join(', ') }, status: :unprocessable_entity
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
                               :default_value, 
                               :control_value, 
                               :interface_name, 
                               :node_type, 
                               :node_attr, 
                               :node_order,
                               :control_string_value,
                               :control_array_value => [])

    attrs.merge(track_id: @track.id)
  end
end
