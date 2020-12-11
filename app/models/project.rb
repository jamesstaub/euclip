class Project < ApplicationRecord
  after_save :set_defaults
  # The set_defaults will only work if the object is new

  belongs_to :creator, class_name: "User" 
  attribute :bpm, :integer, default: 120

  validates :creator, presence: true
  
  private 
  
  def set_defaults
    self.slug = self.id if self.slug.nil?
  end
end