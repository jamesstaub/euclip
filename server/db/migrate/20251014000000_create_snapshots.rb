# A snapshot is a complete set of tracks (and its own tempo) inside a project. A project always has at
# least one; `projects.active_snapshot_id` is the one currently playing/being edited. Edits always apply
# to the active snapshot; "save snapshot" clones it.
class CreateSnapshots < ActiveRecord::Migration[7.0]
  def up
    create_table :snapshots do |t|
      t.references :project, null: false, foreign_key: true
      t.string  :name, null: false
      t.integer :position, null: false, default: 0
      t.integer :bpm, null: false, default: 120
      t.timestamps
    end
    add_index :snapshots, %i[project_id position], unique: true

    add_reference :tracks, :snapshot, foreign_key: true, index: true
    add_reference :projects, :active_snapshot, foreign_key: { to_table: :snapshots }, index: true

    # every existing project becomes one snapshot called "Main" holding its current tracks
    execute <<~SQL
      INSERT INTO snapshots (project_id, name, position, bpm, created_at, updated_at)
      SELECT id, 'Main', 0, bpm, NOW(), NOW() FROM projects
    SQL
    execute <<~SQL
      UPDATE tracks t SET snapshot_id = s.id FROM snapshots s WHERE s.project_id = t.project_id AND s.position = 0
    SQL
    execute <<~SQL
      UPDATE projects p SET active_snapshot_id = s.id FROM snapshots s WHERE s.project_id = p.id AND s.position = 0
    SQL

    change_column_null :tracks, :snapshot_id, false
    # projects.active_snapshot_id stays nullable: a project row exists before its first snapshot (the model enforces it)
  end

  def down
    remove_reference :projects, :active_snapshot, foreign_key: { to_table: :snapshots }
    remove_reference :tracks, :snapshot, foreign_key: true
    drop_table :snapshots
  end
end
