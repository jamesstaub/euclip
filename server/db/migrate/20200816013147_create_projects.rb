class CreateProjects < ActiveRecord::Migration[6.0]
  def change
    create_table :projects do |t|
      t.text :title
      t.text :slug
      t.integer :bpm, default: 120, null: false
      t.references :creator, type: :uuid, references: :users, foreign_key: { to_table: :users, on_delete: :cascade }, null: false
      t.timestamps
    end
  end
end