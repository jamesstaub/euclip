class OnstepScript < Script
  def set_default
    self.type = "OnstepScript"
    self.safe_code = %{if (data) {
  this.playSample(index);
} 
    }
    super
  end
end