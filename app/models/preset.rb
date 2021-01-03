class Preset < ApplicationRecord
  belongs_to :creator, class_name: "User"
  has_one :init_script, :dependent => :destroy
  has_one :onstep_script, :dependent => :destroy
end
