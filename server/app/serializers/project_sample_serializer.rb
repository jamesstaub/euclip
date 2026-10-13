class ProjectSampleSerializer
  include JSONAPI::Serializer
  set_key_transform :dash
  set_type :project_sample
  attributes :path, :label, :position, :onset_threshold, :created_at
  # where the sample is used, so the UI can show it and guard removal
  attribute :usages do |sample|
    sample.usages
  end
  belongs_to :project
end
