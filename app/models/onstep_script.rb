class OnstepScript < Script
  def set_default
    self.type = "OnstepScript"
    
    if self.track&.is_master
      master_track_default_init
    else
      track_default_init
    end  

    super
  end
 
  def master_track_default_init
    self.safe_code = %{

  } if self.safe_code.nil?
  end

  def track_default_init
    self.safe_code = %{if (data) {
  this.play();
} else {
  this.stop();
}
        } if self.safe_code.nil?
  end
end