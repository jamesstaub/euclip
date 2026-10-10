class Preset < ApplicationRecord
  belongs_to :preset_collection
  has_one :init_script, :dependent => :destroy
  has_one :onstep_script, :dependent => :destroy
end
