class Sequence < ApplicationRecord
  after_create :set_default
  belongs_to :track, optional: true

  attribute :hits, :integer, default: 0
  attribute :steps, :integer, default: 8
  attribute :offset, :integer, default: 0
  # nil until assigned, so "no order given" is distinguishable from an explicit 0
  attribute :order, :integer, default: nil

  KINDS = %w[euclidean binary onoff].freeze
  validates :kind, inclusion: { in: KINDS }
  validates :value, numericality: { only_integer: true, in: 0..127 }
  validates :on_steps, :off_steps, numericality: { only_integer: true, in: 0..64 }
  validates :times, numericality: { only_integer: true, in: 1..64 }

  # steps per tick of the project clock: 0.5 and 2 are half and double speed (cracked takes whole divisions: 1/n and n)
  RATES = [0.25, 0.5, 1.0, 2.0, 4.0].freeze
  validates :rate, inclusion: { in: RATES }
  # the highest value a step can hold (1: on/off). A multi-sample kit uses one value per sampler
  validates :max_value, numericality: { only_integer: true, in: 1..64 }

  # position within the track: the track's primary sequence has the lowest order
  validates :order, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :order, uniqueness: { scope: :track_id }, if: :track_id?
  before_validation :assign_next_order, on: :create

  def set_default
    # TODO: frontend sequencer logic like this should move out of models into dedicated service objects
    # along with other euclip-specific settings
    if track&.is_master
      update(hits: 0, steps: 64)
    end
  end

  private

  # new sequences go after the track's existing ones unless an order was given
  def assign_next_order
    return unless order.nil?
    self.order = track_id ? (Sequence.where(track_id: track_id).maximum(:order) || -1) + 1 : 0
  end
end
