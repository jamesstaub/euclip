class TrackSerializer
  include JSONAPI::Serializer
  attributes :id, :hits, :steps, :offset, :filepath, :custom_sequence
  belongs_to :project
end
