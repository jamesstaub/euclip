class TrackControlSerializer
  include JSONAPI::Serializer
  attributes :min, :max, :default_value, :control_value, :control_array_value, :node_attr, :interface_name
end
