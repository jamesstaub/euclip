class CreatePresetCollections < ActiveRecord::Migration[6.0]
  def change
    create_table :preset_collections do |t|
      t.string :title
      t.timestamps
      t.references :creator, type: :uuid, references: :users, index: true, foreign_key: { to_table: :users, on_delete: :cascade }, null: false
    end
  end
end
