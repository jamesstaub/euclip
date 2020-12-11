class ProjectSerializer
  include FastJsonapi::ObjectSerializer

  attributes :id, :title, :created_at, :slug, :bpm, :creator_id
  belongs_to :creator, record_type: :user
end
