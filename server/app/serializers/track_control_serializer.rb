class TrackControlSerializer
  include JSONAPI::Serializer
  set_key_transform :dash
  belongs_to :track
  attributes :min, 
             :max, 
             :step_size, 
             :default_value, 
             :control_value, 
             :control_array_value,
             :node_attr, 
             :node_type, 
             :node_order, 
             :interface_name, 
             :current_unit_transform_idx, 
             :apply_hits_only
end