class CreateFilepathControls < ActiveRecord::Migration[7.0]
  def up
    create_table :filepath_controls do |t|
      t.string :control_value
      t.integer :node_order
      t.belongs_to :track, null: false, foreign_key: true
      t.timestamps
    end

    TrackControl.transaction do
      TrackControl.where(node_attr: 'path', node_type: 'sampler').each do |track_control|
        FilepathControl.create!(control_value: track_control.control_string_value, track: track_control.track)
        track_control.destroy
      end
    end
  end

  def down
    TrackControl.transaction do
      FilepathControl.all.each do |filepath_control|
        track_control = TrackControl.new(node_attr: 'path', node_type: 'sampler')
        track_control.control_string_value = filepath_control.control_value
        track_control.track = filepath_control.track
        track_control.save!
      end
    end

    drop_table :filepath_controls
  end
end