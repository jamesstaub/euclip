class TrackNodeSerializer
  include JSONAPI::Serializer
  attributes :default_control_interface, :is_channel_strip_child, :node_type, :order
  belongs_to :track
  has_many :track_controls
end
