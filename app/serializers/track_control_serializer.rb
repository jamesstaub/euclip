class TrackControlSerializer
  include JSONAPI::Serializer
  set_key_transform :dash
  attributes :min, :max, :default_value, :control_value, :control_array_value, :node_attr, :node_type, :node_order, :interface_name
end