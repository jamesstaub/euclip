class AddUnitTransformToTrackControl < ActiveRecord::Migration[7.0]
  def change
    add_column :track_controls, :current_unit_transform_idx, :integer, default: 0
  end
end
