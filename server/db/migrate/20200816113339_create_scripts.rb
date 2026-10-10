class CreateScripts < ActiveRecord::Migration[6.0]
  def change
    create_table :scripts do |t|
      t.text :type
      t.text :safe_code
      t.text :editor_content
      t.belongs_to :track, foreign_key: true
      t.timestamps
    end
  end
end
