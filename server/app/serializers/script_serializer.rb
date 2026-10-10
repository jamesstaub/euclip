class ScriptSerializer
  include JSONAPI::Serializer
  set_key_transform :dash
  attributes :safe_code, :editor_content
  belongs_to :track
end