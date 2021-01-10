class CreateSequences < ActiveRecord::Migration[6.0]
  def change
    create_table :sequences do |t|
      t.integer :hits
      t.integer :steps
      t.integer :offset
      t.float :custom_sequence, array: true, default: []
      
      t.references :track, null: false, foreign_key: true

      t.timestamps
    end
  end
end
