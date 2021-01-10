class CreateTrackControls < ActiveRecord::Migration[6.0]
  def change
    create_table :track_controls do |t|
      t.integer :min
      t.integer :max
      t.float :default_value
      t.float :control_value
      t.float :control_array_value, array: true, default: []
      t.string :control_string_value
      t.text :node_attr
      t.text :interface_name
      
      t.text :node_type
      t.integer :node_order

      t.belongs_to :track, null: false, foreign_key: true

      t.timestamps
    end
  end
end
