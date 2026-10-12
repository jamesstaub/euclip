class ProjectSerializer
  include FastJsonapi::ObjectSerializer
  set_key_transform :dash

  attributes :id, :title, :created_at, :slug, :bpm, :creator_id
  belongs_to :creator, record_type: :user
  # the tracks of the active snapshot (the one being played and edited); other snapshots' tracks come with `snapshots`
  has_many :tracks do |project|
    project.active_tracks
  end
  has_many :snapshots
  belongs_to :active_snapshot, serializer: :snapshot, record_type: :snapshot
  has_many :project_samples, record_type: :project_sample
end
