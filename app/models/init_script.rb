class InitScript < Script
  def set_default
    self.type = "InitScript"
    if self.track&.is_master
      master_track_default_init
    else
      track_default_init
    end
    
    super    
  end
  
  def master_track_default_init
    self.safe_code = %{__()
  .compressor({
    release: .1,
    id: 'main-output',
  })
  .channelStrip()
  .dac();
  } if self.safe_code.nil?
  end

  def track_default_init
    self.safe_code = %{__()
  .sampler({
    path: this.filepath,
  })
  .gain()
  .channelStrip()
  .connect('#main-output')
        } if self.safe_code.nil?
  end
end
