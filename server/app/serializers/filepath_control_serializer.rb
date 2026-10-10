class FilepathControlSerializer
  include JSONAPI::Serializer
  set_key_transform :dash
  belongs_to :track
  attributes :control_value,
             :node_order,
             :created_at
end
