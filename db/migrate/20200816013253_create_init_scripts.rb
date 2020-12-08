class CreateInitScripts < ActiveRecord::Migration[6.0]
  def change
    create_table :init_scripts do |t|

      t.timestamps
    end
  end
end
