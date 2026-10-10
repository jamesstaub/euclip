class PresetCollection < ApplicationRecord
  belongs_to :creator, class_name: "User"
  has_many :presets, :dependent => :destroy
end
