class ProjectSerializer
  include FastJsonapi::ObjectSerializer
  set_key_transform :dash

  attributes :id, :title, :created_at, :slug, :bpm, :creator_id
  belongs_to :creator, record_type: :user
  has_many :tracks
end
