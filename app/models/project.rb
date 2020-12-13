class Project < ApplicationRecord
  belongs_to :creator, class_name: "User" 
  has_many :tracks

  after_save :set_defaults
  attribute :bpm, :integer, default: 120
  validates :creator, presence: true
  
  private 
  
  def set_defaults
    self.slug = self.id if self.slug.nil?
  end
end