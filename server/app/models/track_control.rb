class TrackControl < ApplicationRecord
  validates_inclusion_of :interface_name, :in => %w(dial toggle slider multislider position piano envelope)

  belongs_to :track

  # a control is identified by the node it drives: one per (track, node type, node order, attr)
  validates :node_attr, uniqueness: { scope: %i[track_id node_type node_order],
                                      message: 'already has a control for this node' }
  validates :sequence_order, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

end
