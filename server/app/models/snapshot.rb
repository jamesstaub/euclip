# A saved state of a project: a tempo plus the settings of its tracks (control values, sequences and
# onstep scripts), kept in `data` and keyed by track id. The tracks themselves, their init scripts and the
# sample pool are shared by all snapshots, so switching never rebuilds any audio. The client captures and
# applies `data`; the project's active snapshot is the one currently loaded into the tracks.
class Snapshot < ApplicationRecord
  belongs_to :project

  validates :name, presence: true
  validates :bpm, numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: 999 }
  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 },
                       uniqueness: { scope: :project_id }
  validate :data_is_a_hash

  # nil until assigned, so "no position given" is distinguishable from an explicit 0
  attribute :position, :integer, default: nil
  before_validation :assign_position, on: :create

  def active?
    project.active_snapshot_id == id
  end

  def self.copy_name(project, name)
    base = "#{name} copy"
    return base unless project.snapshots.exists?(name: base)

    n = 2
    n += 1 while project.snapshots.exists?(name: "#{base} #{n}")
    "#{base} #{n}"
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

  def data_is_a_hash
    errors.add(:data, 'must be an object') unless data.is_a?(Hash)
  end
end
