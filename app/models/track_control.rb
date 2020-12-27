class TrackControl < ApplicationRecord
  belongs_to :track_node
  belongs_to :track

  def self.create_for_node(track_node)
    control_attrs = TrackNode.attrs_for_node(track_node.node_type)
    control_attrs.map { |control_attr|
      defaults = self.default_for_attr(control_attr, track_node.node_type)
      defaults[:control_value] = defaults[:default_value]
      track_control_params = {
        track_id: track_node.track_id,
        track_node_id: track_node.id,
        node_attr: control_attr, 
        interface_name: track_node['default_control_interface'] || 'slider', # all controls for 
        control_array_value: [], # api must initialize this whenever a multislider is created
      }
      track_control_params.merge!(defaults)
      self.create!(track_control_params)
    }
  end

  private 

  def self.default_for_attr(control_attr, node_type)
    param_defaults = {}
    case control_attr
    when 'bits'
      param_defaults[:min] = 1
      param_defaults[:max] = 16
      param_defaults[:default_value] = 6
    when 'color'
      param_defaults[:min] = 0
      param_defaults[:max] = 1000
      param_defaults[:default_value] = 800
    when 'cutoff'
      param_defaults[:min] = 0
      param_defaults[:max] = 4000
      param_defaults[:default_value] = 1500
    when 'damping'
      param_defaults[:min] = 0
      param_defaults[:max] = 1
      param_defaults[:default_value] = 0.84
    when 'decay'
      param_defaults[:min] = 0
      param_defaults[:max] = 4
      param_defaults[:default_value] = 0
    when 'delay'
      param_defaults[:min] = 0
      param_defaults[:max] = 6
      param_defaults[:default_value] = 2
    when 'detune'
      param_defaults[:min] = 0
      param_defaults[:max] = 100
      param_defaults[:default_value] = 0
    when 'distortion'
      param_defaults[:min] = 0
      param_defaults[:max] = 3
      param_defaults[:default_value] = 1
    when 'drive'
      param_defaults[:min] = 0
      param_defaults[:max] = 2
      param_defaults[:default_value] = 0.5
    when 'end'
      param_defaults[:min] = 0
      param_defaults[:max] = 1
      param_defaults[:default_value] = 1
    when 'feedback'
      param_defaults[:min] = 0
      param_defaults[:max] = 1
      param_defaults[:default_value] = 0
    when 'frequency'
      if node_type == 'lfo'
        param_defaults[:min] = 0
        param_defaults[:max] = 20
        param_defaults[:default_value] = 5  
      else
        param_defaults[:min] = 0
        param_defaults[:max] = 10000
        param_defaults[:default_value] = 300
      end
    when 'gain'
      param_defaults[:min] = 0
      param_defaults[:max] = 1
      param_defaults[:default_value] = 1
    when 'pan'
      param_defaults[:min] = -1
      param_defaults[:max] = 1
      param_defaults[:default_value] = 0
    when 'postCut'
      param_defaults[:min] = 0
      param_defaults[:max] = 5000
      param_defaults[:default_value] = 3000
    when 'q'
      param_defaults[:min] = 0
      param_defaults[:max] = 20
      param_defaults[:default_value] = 0
    when 'seconds'
      param_defaults[:min] = 0
      param_defaults[:max] = 6
      param_defaults[:default_value] = 0
    when 'speed'
      param_defaults[:min] = 0.125
      param_defaults[:max] = 2
      param_defaults[:default_value] = 1 
    when 'start'
      param_defaults[:min] = 0
      param_defaults[:max] = 1
      param_defaults[:default_value] = 0
    end
    param_defaults
  end
end
