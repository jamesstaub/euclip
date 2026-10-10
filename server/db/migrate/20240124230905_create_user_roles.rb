class CreateUserRoles < ActiveRecord::Migration[7.0]
  def change
    create_table :user_roles, id: :uuid do |t|
      t.references :user, type: :uuid, foreign_key: true
      t.references :project, foreign_key: true
      t.integer :role
      t.timestamps
    end
  end
end
