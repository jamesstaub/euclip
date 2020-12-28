class InitScript < Script
  def set_default
    self.type = "InitScript"
    
    self.safe_code = %{__()
  .sampler({
    id: this.id,
    path: this.filepath,
    ui: 'multislider',
  })
  .gain({
    ui: 'multislider',
  })
  .channelStrip()
  .connect('#mixer')
    
    } if self.safe_code.nil?

    super
  end
end
