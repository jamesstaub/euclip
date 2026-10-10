class Sequence < ApplicationRecord
  after_create :set_default
  belongs_to :track, optional: true

  attribute :hits, :integer, default: 0
  attribute :steps, :integer, default: 8
  attribute :offset, :integer, default: 0

  def set_default
    # TODO: frontend sequencer logic like this should move out of models into dedicated service objects
    # along with other euclip-specific settings
    if track&.is_master
      update(hits: 0, steps: 64)
    end
  end

end
