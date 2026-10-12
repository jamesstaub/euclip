class Script < ApplicationRecord
  # starting scripts apply when a script is created; on later saves a missing value must never be
  # silently replaced with the default
  before_create :set_default
  belongs_to :track, optional: true
  belongs_to :preset, optional: true

  def set_default
    self.editor_content = self.safe_code if self.editor_content.nil?
  end
end
