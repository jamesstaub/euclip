class CreateTracks < ActiveRecord::Migration[6.0]
  def change
    create_table :tracks do |t|
      t.integer :order
      t.integer :hits
      t.integer :steps
      t.integer :offset
      t.text :filepath
      t.float :custom_sequence, array: true, default: []
      t.belongs_to :project, null: false, foreign_key: true

      t.timestamps
    end
  end
end
