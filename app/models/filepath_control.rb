class FilepathControl < ApplicationRecord
  belongs_to :track

  # do not save if control_value is empty or nil
  validates :control_value, presence: true

  # do not save if track is empty or nil
  validates :track, presence: true
    
end
