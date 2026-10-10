class AddApplyHitsOnlyToTrackControl < ActiveRecord::Migration[7.0]
  def change
    add_column :track_controls, :apply_hits_only, :boolean, default: false
  end
end
