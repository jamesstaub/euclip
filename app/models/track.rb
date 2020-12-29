class Track < ApplicationRecord
  before_save :set_new_track_order

  belongs_to :project
  has_one :init_script, :dependent => :destroy
  has_one :onstep_script, :dependent => :destroy
  has_many :track_controls, :dependent => :destroy

  attribute :order, :integer
  
  # euclidean rhythm params, should move to Sequence model eventually
  attribute :hits, :integer, default: 4
  attribute :steps, :integer, default: 8
  attribute :offset, :integer, default: 0
  
  # filepath is specific to Sampler audio node, should be an attribute of TrackControl
  attribute :filepath, :string, default: '/SequentialCircuits%20Tom/kick.mp3'

  def self.create_with_relations(params)
    Track.transaction do
      track = self.create!(params)
      track.create_init_script!
      track.create_onstep_script!
      track
    end
  end

  def set_new_track_order
    self.order = self.project.tracks.count + 1 unless self.order.present?
  end
end