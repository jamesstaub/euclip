# One complete state of a project: its own set of tracks (including its own master/main-output track)
# and its own tempo. The project's *sample pool* is shared by all snapshots. Edits always apply to the
# project's active snapshot; "save snapshot" is #clone!.
class Snapshot < ApplicationRecord
  belongs_to :project
  has_many :tracks, dependent: :destroy

  validates :name, presence: true
  validates :bpm, numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: 999 }
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 },
                       uniqueness: { scope: :project_id }

  # nil until assigned, so "no position given" is distinguishable from an explicit 0
  attribute :position, :integer, default: nil
  before_validation :assign_position, on: :create

  def ordered_tracks
    tracks.where(is_master: false).order(:id)
  end

  def master_track
    tracks.find_by(is_master: true)
  end

  def reorder_tracks!
    ordered_tracks.each_with_index { |track, idx| track.update!(order: idx + 1) }
  end

  def active?
    project.active_snapshot_id == id
  end

  # A full independent copy: every track with its scripts, sequences, controls and sample slots.
  # Sample slots keep pointing at the same pool entries (the pool is shared, never copied).
  def clone!(name: nil)
    transaction do
      copy = project.snapshots.create!(name: name.presence || next_copy_name, bpm: bpm)
      tracks.order(:id).each do |track|
        track_copy = track.amoeba_dup
        track_copy.snapshot = copy
        track_copy.save!
      end
      copy
    end
  end

  # remove this snapshot; a project always keeps at least one, and if this was the active one the nearest
  # remaining snapshot becomes active
  def destroy_and_reassign!
    raise ActiveRecord::RecordNotDestroyed, 'A project needs at least one snapshot' if project.snapshots.count <= 1

    transaction do
      if active?
        replacement = project.snapshots.where.not(id: id).where('position < ?', position).last ||
                      project.snapshots.where.not(id: id).first
        project.update!(active_snapshot: replacement)
      end
      destroy!
      project.snapshots.each_with_index { |s, i| s.update_column(:position, i) } # keep positions dense
    end
  end

  private

  def assign_position
    self.position = (project.snapshots.maximum(:position) || -1) + 1 if position.nil?
  end

  def next_copy_name
    base = "#{name} copy"
    return base unless project.snapshots.exists?(name: base)

    n = 2
    n += 1 while project.snapshots.exists?(name: "#{base} #{n}")
    "#{base} #{n}"
  end
end
