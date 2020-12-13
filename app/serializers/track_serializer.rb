class TrackSerializer
  include JSONAPI::Serializer
  set_key_transform :dash
  attributes :id, :hits, :steps, :offset, :filepath, :custom_sequence
  belongs_to :project
  has_one :init_script
  has_one :onstep_script
end