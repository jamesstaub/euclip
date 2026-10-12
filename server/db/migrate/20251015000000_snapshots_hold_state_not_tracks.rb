# Snapshots no longer own tracks: a project has one set of tracks (one audio graph) and a snapshot is a
# saved set of track *settings* (control values, sequences, onstep scripts) plus a tempo, kept in `data`.
class SnapshotsHoldStateNotTracks < ActiveRecord::Migration[7.0]
  def up
    add_column :snapshots, :data, :jsonb, null: false, default: {}

    # tracks of snapshots that were not active are dropped (snapshots with their own tracks were never released)
    doomed = "SELECT t.id FROM tracks t JOIN projects p ON p.id = t.project_id WHERE t.snapshot_id IS DISTINCT FROM p.active_snapshot_id"
    %w[scripts track_controls filepath_controls sequences].each do |table|
      execute "DELETE FROM #{table} WHERE track_id IN (#{doomed})"
    end
    execute "DELETE FROM tracks WHERE id IN (#{doomed})"
    remove_reference :tracks, :snapshot, foreign_key: true, index: true
  end

  def down
    add_reference :tracks, :snapshot, foreign_key: true, index: true
    remove_column :snapshots, :data
  end
end
