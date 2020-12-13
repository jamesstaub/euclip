class V1::TrackNodesController < ApplicationController
  def create
    @track_node = TrackNode.create_with_relations(track: track)
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
  
  def track
    data = JSON.parse(request.body.read)["data"]
    relationships = data["relationships"] if data.present?
    track_data = relationships["track"] if relationships.present?
    track_id = track_data["data"]["id"] if track_data.present?
    Track.find(track_id)
  end
end
