class Project < ApplicationRecord
  belongs_to :creator, class_name: "User"
  has_many :tracks, :dependent => :destroy

  before_save :set_defaults
  attribute :bpm, :integer, default: 120
  validates :creator, presence: true

  def reorder_tracks!
    self.tracks.ordered_tracks.each_with_index {|track, idx|
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

  def set_defaults
    self.title = "Project #{self.creator.projects.count}" if self.title.nil?
    self.slug = self.title.gsub(/[^0-9a-z ]/i, '').downcase.delete(" ") if self.slug.nil?
  end
end