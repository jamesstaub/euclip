# A sample in a project's pool. The pool belongs to the project and is shared by every snapshot;
# tracks pick samples from it (via their filepath controls).
class ProjectSample < ApplicationRecord
  belongs_to :project
  has_many :filepath_controls, dependent: :restrict_with_error

  validates :path, presence: true, uniqueness: { scope: :project_id }
  validates :label, presence: true, uniqueness: { scope: :project_id }
  validates :onset_threshold, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 1 }

  before_validation :normalize_path
  before_validation :default_label, on: :create
  before_validation :assign_position, on: :create

  # find the pool entry for a path, adding it to the pool if the project doesn't have it yet
  def self.find_or_add!(project, path)
    normalized = normalize(path)
    project.project_samples.find_by(path: normalized) || project.project_samples.create!(path: normalized)
  end

  def self.normalize(path)
    path = path.to_s.strip
    path.start_with?('/') ? path : "/#{path}"
  end

  # where this sample is used: [{ track_id:, slot: }, ...]
  def usages
    filepath_controls.includes(:track).map do |control|
      { track_id: control.track_id, slot: control.node_order }
    end
  end

  private

  def normalize_path
    self.path = self.class.normalize(path) if path.present?
  end

  def default_label
    return if label.present? || path.blank?

    base = File.basename(path, '.*')
    candidate = base
    n = 2
    while project.project_samples.exists?(label: candidate)
      candidate = "#{base} #{n}"
      n += 1
    end
    self.label = candidate
  end

  def assign_position
    self.position = (project.project_samples.maximum(:position) || -1) + 1 if project
  end
end
