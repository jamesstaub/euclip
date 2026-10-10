class PresetSerializer
  include JSONAPI::Serializer
  attributes :id, :title
  set_key_transform :dash
  
  attribute :init_script do |record, params|
    record.init_script.safe_code
  end

  attribute :onstep_script do |record, params|
    record.onstep_script.safe_code
  end

end
