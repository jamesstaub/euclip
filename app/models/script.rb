class Script < ApplicationRecord
  before_save :set_default
  belongs_to :track, optional: true
  belongs_to :preset, optional: true

  def set_default
    self.editor_content = self.safe_code if self.editor_content.nil?
  end
end
