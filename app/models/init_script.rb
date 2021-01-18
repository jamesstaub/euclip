class InitScript < Script
  def set_default
    self.type = "InitScript"
    if self.track.is_master
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
  id: 'mixer',
  class: 'project-#{self.track.project.id}',
})
.channelStrip()
.dac();
  } if self.safe_code.nil?
  end

  def track_default_init
    self.safe_code = %{__()
.sampler({
  id: this.id,
  path: this.filepath,
})
.gain()
.channelStrip()
.connect('#mixer')
        } if self.safe_code.nil?
  end
end
