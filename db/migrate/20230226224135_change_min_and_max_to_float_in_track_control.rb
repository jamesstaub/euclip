class ChangeMinAndMaxToFloatInTrackControl < ActiveRecord::Migration[6.1]
  def change
    change_column :track_controls, :min, :float
    change_column :track_controls, :max, :float
  end
end