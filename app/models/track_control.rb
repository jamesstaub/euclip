class TrackControl < ApplicationRecord
  validates_inclusion_of :interface_name, :in => %w(dial toggle slider multislider position piano envelope filepath)

  belongs_to :track

end
