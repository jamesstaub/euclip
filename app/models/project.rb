class Project < ApplicationRecord
  belongs_to :creator, class_name: "User" 
  has_many :tracks

  after_save :set_defaults
  attribute :bpm, :integer, default: 120
  validates :creator, presence: true

  def reorder_tracks!
    self.tracks.each_with_index {|track, idx|
      track.update!(order: idx + 1)
    }
  end
  
  private 
  
  def set_defaults
    self.slug = self.id if self.slug.nil?
  end
end