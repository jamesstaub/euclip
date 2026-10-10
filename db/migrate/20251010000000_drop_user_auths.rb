# Discord login was removed; the table may exist in production from 20250423000645.
class DropUserAuths < ActiveRecord::Migration[7.0]
  def up
    drop_table :user_auths, if_exists: true
  end

  def down
    # intentionally irreversible: the discord integration no longer exists
    raise ActiveRecord::IrreversibleMigration
  end
end
