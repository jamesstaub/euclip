class CreatePresets < ActiveRecord::Migration[6.0]
  def change
    create_table :presets do |t|
      t.text :title
      t.references :script
      t.belongs_to :preset_collection, null: true
      t.timestamps
    end
  end
end
