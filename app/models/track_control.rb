class TrackControl < ApplicationRecord
  before_save :set_default
  validates_inclusion_of :interface_name, :in => %w(dial toggle slider multislider position piano envelope filepath)

  belongs_to :track

  def set_default
    # node_attr is the attribute that gets passed to the javascript AudioNode object
    # interface_name informs the ember components how to display different UI types
    if self.node_attr == 'path' && !self.control_string_value
      self.interface_name = 'filepath'
      self.control_string_value = get_sample_for_idx
    end
  end

  def get_sample_for_idx
   kit = ["/Roland/Roland%20CR-8000%20CompuRhythm/CR-8000%20Kit%2001/CR8KBASS.mp3",
    "/Roland/Roland%20CR-8000%20CompuRhythm/CR-8000%20Kit%2001/CRSNARE.mp3",
    "/Roland/Roland%20CR-8000%20CompuRhythm/CR-8000%20Kit%2001/CROHH.mp3",
    "/Roland/Roland%20CR-8000%20CompuRhythm/CR-8000%20Kit%2001/CR8KCLAV.mp3",
    "/Roland/Roland%20CR-8000%20CompuRhythm/CR-8000%20Kit%2001/CRLOWTOM.mp3"]
    kit[track.order & kit.length]
  end

end
