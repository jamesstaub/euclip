class CreatePresets < ActiveRecord::Migration[6.0]
  def change
    create_table :presets do |t|
      t.references :creator, type: :uuid, references: :users, index: true, foreign_key: { to_table: :users, on_delete: :cascade }, null: false
      t.references :script
      t.timestamps
    end
  end
end
