class AddScriptsToTracks < ActiveRecord::Migration[6.0]
  def change
    # add_reference :tracks, :init_script, index: true, foreign_key: {to_table: :scripts}
    # add_reference :tracks, :onstep_script, index: true, foreign_key: {to_table: :scripts}
    add_reference :tracks, :script, index: true
  end
end
