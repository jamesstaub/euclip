class Project < ApplicationRecord
  belongs_to :creator, class_name: "User"  
  attribute :bpm, :integer, default: 120

  validates :creator, presence: true
end