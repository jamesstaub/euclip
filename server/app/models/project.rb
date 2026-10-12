class Project < ApplicationRecord
  before_create :set_defaults
  # declared before the has_many dependents so it runs first: the active snapshot must stop being referenced
  # (projects.active_snapshot_id has a foreign key) before the snapshots are destroyed
  before_destroy { update_column(:active_snapshot_id, nil) }

  # TODO: move BPM to "Pattern" model
  attribute :bpm, :integer, default: 120
  belongs_to :creator, class_name: "User"
  has_many :tracks, :dependent => :destroy
  has_one :macros_script, :dependent => :destroy
  has_many :snapshots, -> { order(:position) }, :dependent => :destroy
  # the snapshot being played and edited; every edit applies to it
  belongs_to :active_snapshot, class_name: 'Snapshot', optional: true
  has_many :project_samples, -> { order(:position) }, :dependent => :destroy
  
  has_many :user_roles, :dependent => :destroy
  has_many :users, through: :user_roles

  # NOTE the key "private" can't be used due to name conflict, hence :hidden
  enum access_level: { hidden: 0, public_viewable: 1, public_editable: 2 }

  validates :creator, presence: true

  validate :allow_current_slug_update, on: :update

  after_save :sync_bpm_to_active_snapshot, if: :saved_change_to_bpm?

  # tempo is per snapshot: the project's bpm is the active snapshot's (the column is kept in sync for old clients)
  def bpm
    active_snapshot&.bpm || super
  end

  def ordered_tracks
    tracks.where(is_master: false).order(:id)
  end

  def reorder_tracks!
    ordered_tracks.each_with_index { |track, idx| track.update!(order: idx + 1) }
  end

  def self.create_with_relations!(params)
    project = nil
    transaction do
      project = Project.create!(params)
      snapshot = project.snapshots.create!(name: 'Main', bpm: project.read_attribute(:bpm))
      project.update!(active_snapshot: snapshot)
      project.create_macros_script!
      first_track = Track.create_with_relations!(project: project)
      master_track = Track.create_with_relations!(project: project, is_master: true)
      UserRole.create!(user_id: params[:creator_id], project_id: project.id, role: :creator)
    end
    project
  end


  def self.find_by_slug(slug, creator_id)
    project = Project.includes(
      :user_roles,
      :tracks,
      :macros_script,
      tracks: [:init_script, :onstep_script, :sequences]
    )
    .find_by(
              slug: slug, 
              creator_id: creator_id
            )
            
  end

  private 

  def sync_bpm_to_active_snapshot
    active_snapshot&.update!(bpm: read_attribute(:bpm)) if active_snapshot && active_snapshot.bpm != read_attribute(:bpm)
  end
  
  def allow_current_slug_update
    existing_record = Project.find_by(slug: slug, creator_id: creator_id)
    if existing_record && existing_record != self
      errors.add(:slug, 'has already been taken by another record')
    end
  end

  def set_defaults
    self.title = "Project #{self.creator.projects.count}" if self.title.nil?
    slug = self.title.gsub(/[^0-9a-z ]/i, '').downcase.delete(" ") if self.slug.nil?

    # check if there's a project with the same slug owned by this creator, if so, append a number
    if Project.where(slug: slug, creator_id: self.creator_id).count > 0
      slug = "#{slug}-#{2}"
    end

    self.slug = slug
  end
end