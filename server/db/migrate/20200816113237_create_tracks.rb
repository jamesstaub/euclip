class CreateTracks < ActiveRecord::Migration[6.0]
  def change
    create_table :tracks do |t|
      t.boolean :is_master, default: false
      t.integer :order
      t.belongs_to :project, null: false, foreign_key: true
      t.timestamps
    end
  end
end
