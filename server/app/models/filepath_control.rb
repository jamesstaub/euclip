class FilepathControl < ApplicationRecord
  belongs_to :track
  # the sample this slot plays, from the project's pool. The pool entry is the source of truth;
  # control_value stays as a copy of its path for older clients.
  belongs_to :project_sample, optional: true
  before_validation :sync_with_pool
  validate :sample_belongs_to_track_project

  # do not save if control_value is empty or nil
  validates :control_value, presence: true

  # do not save if track is empty or nil
  validates :track, presence: true

  # node_order is the sampler slot: a track has at most one file per slot (0, 1, 2...)
  validates :node_order, numericality: { only_integer: true, greater_than_or_equal_to: 0 },
                         uniqueness: { scope: :track_id, message: 'already has a file for this sampler slot' }

  private

  def sync_with_pool
    return unless track

    if project_sample && (project_sample_id_changed? || control_value.blank?)
      # picked from the pool: it decides the path
      self.control_value = project_sample.path
    elsif control_value.present? && (new_record? || control_value_changed?)
      # set by path (older clients, bulk creation): find or add the pool entry
      self.project_sample = ProjectSample.find_or_add!(track.project, control_value)
      self.control_value = project_sample.path
    end
  end

  def sample_belongs_to_track_project
    return unless project_sample && track

    errors.add(:project_sample, 'must be in this project\'s pool') if project_sample.project_id != track.project_id
  end
end
