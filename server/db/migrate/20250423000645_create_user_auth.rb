class CreateUserAuth < ActiveRecord::Migration[7.0]
  def change
    create_table :user_auths do |t|
      t.uuid :user_id, null: false, foreign_key: true # Ensure the type matches the `id` column in `users`
      t.string :provider, null: false
      t.string :uid, null: false
      t.string :access_token, null: false
      t.string :avatar_id, null: true
      t.datetime :token_expires_at
      t.jsonb :extra_data

      t.timestamps
    end

    add_index :user_auths, [:provider, :uid], unique: true
    add_foreign_key :user_auths, :users, column: :user_id
  end
end
