class Track < ApplicationRecord
  before_save :set_new_track_order

  belongs_to :project
  has_one :init_script, :dependent => :destroy
  has_one :onstep_script, :dependent => :destroy
  has_many :track_controls, :dependent => :destroy
  has_many :filepath_controls, :dependent => :destroy
  has_many :sequences, -> { order(:order, :id) }, :dependent => :destroy

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

      if params[:file_path].present?
        file_path = params.delete(:file_path)
      end

      requested_type = params.delete(:track_type)
      # the master track (main output) has its own default scripts and is not one of the user-facing types
      type = params[:is_master] ? nil : TrackType.fetch(requested_type)
      track = self.create!(params.merge(track_type: type ? type.key : 'master'))

      if type
        track.create_init_script!(safe_code: type.init_script)
        type.sequences.each_with_index { |attrs, i| track.sequences.create!(attrs.merge(order: i)) }
        track.create_onstep_script!(safe_code: type.onstep_script)
      else
        track.create_init_script!
        track.sequences.create!(order: 0)
        track.create_onstep_script!
      end
      track.filepath_controls.create(control_value: file_path, node_order: 0) if file_path.present?
      track
    end
  end

  def self.create_many_from_filepaths!(project, file_paths)
    file_paths.map do |file_path|
      Track.create_with_relations!({
        project_id: project.id,
        file_path: file_path
      })
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