class SequenceSerializer
  include JSONAPI::Serializer
  set_key_transform :dash
  attributes :id, :hits, :steps, :offset, :custom_sequence, :order, :kind, :value, :on_steps, :off_steps, :times, :rate, :max_value
end
