class FilepathControl < ApplicationRecord
  belongs_to :track

  # do not save if control_value is empty or nil
  validates :control_value, presence: true

  # do not save if track is empty or nil
  validates :track, presence: true

  # node_order is the sampler slot: a track has at most one file per slot (0, 1, 2...)
  validates :node_order, numericality: { only_integer: true, greater_than_or_equal_to: 0 },
                         uniqueness: { scope: :track_id, message: 'already has a file for this sampler slot' }
end
