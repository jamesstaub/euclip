class SnapshotSerializer
  include JSONAPI::Serializer
  set_key_transform :dash
  attributes :name, :position, :bpm, :data, :created_at
  belongs_to :project
end
