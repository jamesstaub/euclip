class CreateAllowlistedJwts < ActiveRecord::Migration[6.0]
  def change
    create_table :allowlisted_jwts, id: :uuid do |t|
      t.string :jti, null: false
      t.string :aud
      t.datetime :exp, null: false
      t.references :user, type: :uuid, foreign_key: { on_delete: :cascade }, null: false

      t.timestamps null: false
    end

    add_index :allowlisted_jwts, :jti, unique: true
  end
end
