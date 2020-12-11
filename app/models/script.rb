class Script < ApplicationRecord
  belongs_to :track, optional: true
end
