class Sequence < ApplicationRecord
  after_create :set_default
  belongs_to :track, optional: true

  attribute :hits, :integer, default: 4
  attribute :steps, :integer, default: 8
  attribute :offset, :integer, default: 0

  def set_default
    if track&.is_master
      update(hits: 0, steps: 64)
    end
  end

end
