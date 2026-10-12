# The number the init script gave this control (in the node's native units), kept apart from
# default_value, which the user can change and which is in the current unit's space. Comparing the
# script's literal against this tells us whether the *script* changed, so a rebuild resets a control
# only when the script was edited, never because the user moved a slider or switched units.
class AddScriptValueToTrackControls < ActiveRecord::Migration[7.0]
  def change
    add_column :track_controls, :script_value, :float
  end
end
