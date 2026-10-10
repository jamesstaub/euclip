class AddStepSizeToTrackControls < ActiveRecord::Migration[6.1]
  def change
    add_column :track_controls, :step_size, :decimal
  end
end
