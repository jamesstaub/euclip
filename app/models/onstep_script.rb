class OnstepScript < Script
  def set_default
    self.type = "OnstepScript"

      self.safe_code = %{if (data) {
  this.playSample();
} 
    } if self.safe_code.nil?

    super
  end
end