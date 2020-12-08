class CreateOnstepScripts < ActiveRecord::Migration[6.0]
  def change
    create_table :onstep_scripts do |t|

      t.timestamps
    end
  end
end
