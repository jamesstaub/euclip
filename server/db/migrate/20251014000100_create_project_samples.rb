# The project sample pool: every sample a project uses, once, shared by all snapshots. Tracks point at a
# pool entry from their filepath control (`project_sample_id`) instead of owning a path of their own.
class CreateProjectSamples < ActiveRecord::Migration[7.0]
  def up
    create_table :project_samples do |t|
      t.references :project, null: false, foreign_key: true
      t.string  :path, null: false   # catalog path, e.g. "/Roland/TR 808/kick.mp3"
      t.string  :label, null: false  # short name scripts and the UI use, unique per project
      t.integer :position, null: false, default: 0
      t.timestamps
    end
    add_index :project_samples, %i[project_id path], unique: true
    add_index :project_samples, %i[project_id label], unique: true

    add_reference :filepath_controls, :project_sample, foreign_key: true, index: true

    # backfill: one pool entry per distinct path used in a project, then point each filepath control at it
    execute <<~SQL
      INSERT INTO project_samples (project_id, path, label, position, created_at, updated_at)
      SELECT project_id, path, path AS label, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY MIN(fid)) - 1, NOW(), NOW()
      FROM (
        SELECT t.project_id,
               CASE WHEN fc.control_value LIKE '/%' THEN fc.control_value ELSE '/' || fc.control_value END AS path,
               fc.id AS fid
        FROM filepath_controls fc JOIN tracks t ON t.id = fc.track_id
        WHERE fc.control_value IS NOT NULL AND fc.control_value <> ''
      ) paths
      GROUP BY project_id, path
    SQL

    # labels start as the file name without extension; make them unique within a project
    execute <<~SQL
      WITH named AS (
        SELECT id, project_id,
               regexp_replace(regexp_replace(path, '^.*/', ''), '\\.[^.]*$', '') AS base,
               ROW_NUMBER() OVER (PARTITION BY project_id, regexp_replace(regexp_replace(path, '^.*/', ''), '\\.[^.]*$', '') ORDER BY id) AS n
        FROM project_samples
      )
      UPDATE project_samples ps
      SET label = CASE WHEN named.n = 1 THEN named.base ELSE named.base || ' ' || named.n END
      FROM named WHERE ps.id = named.id
    SQL

    execute <<~SQL
      UPDATE filepath_controls fc SET project_sample_id = ps.id
      FROM tracks t, project_samples ps
      WHERE t.id = fc.track_id AND ps.project_id = t.project_id
        AND ps.path = CASE WHEN fc.control_value LIKE '/%' THEN fc.control_value ELSE '/' || fc.control_value END
    SQL
  end

  def down
    remove_reference :filepath_controls, :project_sample, foreign_key: true
    drop_table :project_samples
  end
end
