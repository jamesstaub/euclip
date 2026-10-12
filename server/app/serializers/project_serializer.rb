class ProjectSerializer
  include FastJsonapi::ObjectSerializer
  set_key_transform :dash

  attributes :id, :title, :created_at, :slug, :bpm, :creator_id
  belongs_to :creator, record_type: :user
  has_many :tracks
  has_one :macros_script, record_type: :macros_script
  has_many :snapshots
  belongs_to :active_snapshot, serializer: :snapshot, record_type: :snapshot
  has_many :project_samples, record_type: :project_sample
end
