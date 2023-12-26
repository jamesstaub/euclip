class CreateSearchableFiles < ActiveRecord::Migration[6.1]
  def change
    create_table :searchable_directories, id: :uuid do |t|
      t.string :name
      t.integer :depth
      t.references :parent, null: true, foreign_key: { to_table: :searchable_directories, on_delete: :cascade }, type: :uuid
      t.references :root, null: true, foreign_key: { to_table: :searchable_directories, on_delete: :cascade }, type: :uuid
      t.timestamps
    end
    
    create_table :searchable_files, id: :uuid do |t|
      t.string :name
      t.string :file_extension
      t.integer :depth
      t.references :searchable_directory, null: false, foreign_key: true, type: :uuid
      t.references :root, null: true, foreign_key: { to_table: :searchable_directories, on_delete: :cascade }, type: :uuid
      t.timestamps
    end
    
    remove_index :searchable_directories, name: 'index_searchable_directories_on_root_id' if index_exists?(:searchable_directories, :root_id)

    add_index :searchable_directories, :root_id
    add_index :searchable_files, :name
    add_index :searchable_directories, :name
  end
end
