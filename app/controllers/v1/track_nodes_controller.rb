class V1::TrackNodesController < ApplicationController
  before_action ->{ authenticate_user!(force: true) }, only: %i[create update]
  before_action :set_track_node, only: %i[show update]

  def show
    render json: TrackNodeSerializer.new(@track_node), status: :ok
  end
  
  def create
    @track_node = TrackNode.create_with_relations(clean_params)
    if @track_node
      render json: TrackNodeSerializer.new(
        @track_node,
        include: included_relations
      ), status: :ok
    else
      render json: { errors: @track_node.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  def update
    @track_node.update(clean_params)
    if @track_node.save
      render json: TrackNodeSerializer.new(
        @track_node,
        include: included_relations
      ), status: :ok
    else
      render json: { errors: @track_node.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end
  
  private

  def set_track_node
    @track_node = TrackNode.find(params["id"])
  end

  def clean_params
    attrs = @attributes.permit(:default_control_interface, :node_type, :order, :is_channel_strip_child).to_h
    track = get_related_track if @relationships.present?
    attrs.merge(track: track)
  end
    
end
