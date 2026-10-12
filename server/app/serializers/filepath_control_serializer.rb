class FilepathControlSerializer
  include JSONAPI::Serializer
  set_key_transform :dash
  belongs_to :track
  belongs_to :project_sample, record_type: :project_sample
  attributes :control_value,
             :node_order,
             :created_at
end
