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

  amoeba do
    enable
    exclude_field :project
  end

  def self.create_with_relations(params)
    Track.transaction do
      track = self.create!(params)
      track.create_init_script!
      track.create_onstep_script!
      track
    end
  end

  def self.dup_with_relations(params)
    target_track = Track.find(params[:duplicate_id])
    new_track = target_track.amoeba_dup
    new_track.project_id = params[:project_id]
    
    # increment the track order number for this track and all above it
    self.increment_orders!(new_track) 
    new_track
  end

  def self.increment_orders!(track)
    tracks_to_increment = track.project.tracks.where("tracks.order >= ?", track.order)
    tracks_to_increment.each { |t|
      t.order = t.order + 1
      t.save
    }
  end

  def set_new_track_order
    self.order = self.project.tracks.count + 1 unless self.order.present?
  end
end