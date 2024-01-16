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
  // this.stop();
}

/** Exmaples: try uncommenting these **/

/** 
if (data) {
  this.play({loop: true});  
} else {
  this.select('sampler').attr({loop: false});
}

this.select('sampler').attr({speed: index})

**/  

/**
  this.play() is a shortcut for __('sampler').stop().attrs({}).play()
  under the hood this.play() also makes sure to apply the current parameters from the Track Controls

**/
 
        } if self.safe_code.nil?
  end
end