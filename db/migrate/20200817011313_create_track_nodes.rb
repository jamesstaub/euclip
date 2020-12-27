class CreateTrackNodes < ActiveRecord::Migration[6.0]
  def change
    create_table :track_nodes do |t|
      t.text :default_control_interface
      t.boolean :is_channel_strip_child
      t.text :node_type, null: false
      t.integer :order
      t.belongs_to :track, null: false, foreign_key: true

      t.timestamps
    end
  end
end
