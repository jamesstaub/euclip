class PresetCollectionSerializer
  include JSONAPI::Serializer
  set_key_transform :dash
  attributes :id, :title

  has_many :presets
end
