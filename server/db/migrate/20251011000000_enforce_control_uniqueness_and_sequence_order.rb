# Tracks can have several sequences and several sampler files. Make that explicit and safe:
#  * sequences get an `order` (position within the track)
#  * track_controls / filepath_controls become unique per (track, node, attr / node_order); this
#    ends the race that produced duplicate controls. Existing duplicates are resolved first.
class EnforceControlUniquenessAndSequenceOrder < ActiveRecord::Migration[7.0]
  def up
    # --- sequences: position within the track -------------------------------------------------
    add_column :sequences, :order, :integer, null: false, default: 0
    execute <<~SQL
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY track_id ORDER BY id) - 1 AS pos FROM sequences
      )
      UPDATE sequences s SET "order" = ranked.pos FROM ranked WHERE s.id = ranked.id
    SQL
    add_index :sequences, %i[track_id order], unique: true

    # --- track_controls: one control per (track, node type, node order, attr) -------------------
    # keep the most recently updated of any duplicates (that is the one the user last touched)
    execute <<~SQL
      DELETE FROM track_controls a USING track_controls b
      WHERE a.track_id = b.track_id
        AND a.node_type  IS NOT DISTINCT FROM b.node_type
        AND a.node_order IS NOT DISTINCT FROM b.node_order
        AND a.node_attr  IS NOT DISTINCT FROM b.node_attr
        AND (a.updated_at < b.updated_at OR (a.updated_at = b.updated_at AND a.id < b.id))
    SQL
    add_index :track_controls, %i[track_id node_type node_order node_attr],
              unique: true, name: 'index_track_controls_on_track_node_attr'
    # which of the track's sequences a (multislider) control follows
    add_column :track_controls, :sequence_order, :integer, null: false, default: 0

    # --- filepath_controls: one file per sampler slot of a track --------------------------------
    # older clients wrote node_order 0 for every file; renumber each track's files 0..n-1 by age
    execute <<~SQL
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY track_id ORDER BY COALESCE(node_order, 0), id) - 1 AS pos
        FROM filepath_controls
      )
      UPDATE filepath_controls f SET node_order = ranked.pos FROM ranked WHERE f.id = ranked.id
    SQL
    change_column_null :filepath_controls, :node_order, false, 0
    change_column_default :filepath_controls, :node_order, from: nil, to: 0
    add_index :filepath_controls, %i[track_id node_order], unique: true
  end

  def down
    remove_index :filepath_controls, %i[track_id node_order]
    change_column_default :filepath_controls, :node_order, from: 0, to: nil
    change_column_null :filepath_controls, :node_order, true
    remove_column :track_controls, :sequence_order
    remove_index :track_controls, name: 'index_track_controls_on_track_node_attr'
    remove_index :sequences, %i[track_id order]
    remove_column :sequences, :order
  end
end
