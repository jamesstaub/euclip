class Project < ApplicationRecord
  belongs_to :creator, class_name: "User"
  has_many :tracks, :dependent => :destroy

  before_create :set_defaults
  attribute :bpm, :integer, default: 120
  validates :creator, presence: true

  validates :slug, uniqueness: { scope: :creator_id, on: :create }
  validate :allow_current_slug_update, on: :update

  def ordered_tracks
    tracks.where(:is_master => false).order(:id)
  end

  def reorder_tracks!
    self.ordered_tracks.each_with_index {|track, idx|
      track.update!(order: idx + 1)
    }
  end
  
  def self.create_with_relations!(params)
    project = Project.create!(params)
    first_track = Track.create_with_relations!(project: project)
    master_track = Track.create_with_relations!(project: project, is_master: true)
    project
  end

  private 
  
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