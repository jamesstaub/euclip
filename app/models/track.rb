class Track < ApplicationRecord
  before_save :set_new_track_order

  belongs_to :project
  has_one :init_script, :dependent => :destroy
  has_one :onstep_script, :dependent => :destroy
  has_many :track_controls, :dependent => :destroy
  has_many :sequences, :dependent => :destroy

  attribute :is_master, :boolean
  attribute :order, :integer

  scope :master_track, -> { where(:is_master => true)}

  # cloning of active record associations
  amoeba do
    enable
    exclude_association :project
  end

  def self.create_with_relations!(params)
    Track.transaction do
      track = self.create!(params)
      track.create_init_script!
      track.sequences.create!
      track.create_onstep_script!
      
      track
    end
  end

  def self.dup_with_relations(params)
    target_track = Track.find(params[:duplicate_id])
    new_track = target_track.amoeba_dup
    new_track.project_id = params[:project_id]
    
    # increment the track order number for this track and all above it
    self.increment_orders!(target_track, new_track) 
    new_track
  end

  def self.increment_orders!(old_track, new_track)
    new_track.update!(order: old_track.order + 1)
    tracks_to_increment = old_track.project.tracks.where.not(id: new_track.id).where("tracks.order >= ?", new_track.order)
    tracks_to_increment.each { |t|
      t.order = t.order + 1
      t.save
    }
  end

  def set_new_track_order
    self.order = self.project.ordered_tracks.count + 1 unless self.order.present? || self.is_master
    self.order = nil if self.is_master
  end
end