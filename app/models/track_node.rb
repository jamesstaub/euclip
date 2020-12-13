class TrackNode < ApplicationRecord
  belongs_to :track
  has_many :track_controls

  def self.create_with_relations(params)
    TrackNode.create(params)
  end
end
