class Sequence < ApplicationRecord
  belongs_to :track, optional: true

  attribute :hits, :integer, default: 4
  attribute :steps, :integer, default: 8
  attribute :offset, :integer, default: 0

end
