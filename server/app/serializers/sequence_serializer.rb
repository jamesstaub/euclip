class SequenceSerializer
  include JSONAPI::Serializer
  set_key_transform :dash
  attributes :id, :hits, :steps, :offset, :custom_sequence
end
