class Track < ApplicationRecord
  belongs_to :project
  belongs_to :init_script
  belongs_to :onstep_script
end
