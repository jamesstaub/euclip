class TrackNode < ApplicationRecord
  belongs_to :track
  has_many :track_controls, :dependent => :destroy

  def self.create_with_relations(params)
    track_node = TrackNode.create(params)
    TrackControl.create_for_node(track_node)
    track_node
  end

  def self.attrs_for_node(node_type)
    case node_type 
    when 'bitcrusher'
      ['frequency', 'bits']
    when 'comb'
      ['delay', 'damping', 'cutoff', 'feedback']
    when 'delay'
      ['delay', 'damping', 'feedback', 'cutoff', 'frequency']
    when 'gain'
      ['gain']
    when 'lowpass' || 'highpass' || 'bandpass' || 'allpasss' || 'notch'
      ['frequency', 'q']
    when 'lowshelf' || 'highshelf' || 'peaking'
      ['frequency', 'q', 'gain']
    when 'lfo'
      ['frequency', 'gain']
    when 'overdrive'
      ['drive', 'color', 'postCut']
    when 'panner'
      ['pan']
    when 'reverb'
      ['decay', 'reverse']
    when 'ring'
      ['distortion', 'frequency']
    when 'sampler'
      ['speed']
    when 'sine' || 'square' || 'triangle' || 'sawtooth'
      ['frequency', 'detune']
    end
  end
end
