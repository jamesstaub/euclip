class AddPresetToScripts < ActiveRecord::Migration[6.0]
  def change
    add_reference :scripts, :preset, foreign_key: true
  end
end
