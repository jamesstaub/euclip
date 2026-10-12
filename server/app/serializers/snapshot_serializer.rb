class SnapshotSerializer
  include JSONAPI::Serializer
  set_key_transform :dash
  attributes :name, :position, :bpm, :created_at
  belongs_to :project
  has_many :tracks
end
