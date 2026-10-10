# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.0].define(version: 2025_10_12_000000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pgcrypto"
  enable_extension "plpgsql"

  create_table "active_storage_attachments", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.uuid "record_id", null: false
    t.uuid "blob_id", null: false
    t.datetime "created_at", precision: nil, null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", precision: nil, null: false
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "allowlisted_jwts", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "jti", null: false
    t.string "aud"
    t.datetime "exp", precision: nil, null: false
    t.uuid "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["jti"], name: "index_allowlisted_jwts_on_jti", unique: true
    t.index ["user_id"], name: "index_allowlisted_jwts_on_user_id"
  end

  create_table "filepath_controls", force: :cascade do |t|
    t.string "control_value"
    t.integer "node_order", default: 0, null: false
    t.bigint "track_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["track_id", "node_order"], name: "index_filepath_controls_on_track_id_and_node_order", unique: true
    t.index ["track_id"], name: "index_filepath_controls_on_track_id"
  end

  create_table "preset_collections", force: :cascade do |t|
    t.string "title"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.uuid "creator_id", null: false
    t.index ["creator_id"], name: "index_preset_collections_on_creator_id"
  end

  create_table "presets", force: :cascade do |t|
    t.text "title"
    t.bigint "script_id"
    t.bigint "preset_collection_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["preset_collection_id"], name: "index_presets_on_preset_collection_id"
    t.index ["script_id"], name: "index_presets_on_script_id"
  end

  create_table "projects", force: :cascade do |t|
    t.text "title"
    t.text "slug"
    t.integer "bpm", default: 120, null: false
    t.uuid "creator_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "access_level"
    t.index ["creator_id"], name: "index_projects_on_creator_id"
  end

  create_table "scripts", force: :cascade do |t|
    t.text "type"
    t.text "safe_code"
    t.text "editor_content"
    t.bigint "track_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "preset_id"
    t.index ["preset_id"], name: "index_scripts_on_preset_id"
    t.index ["track_id"], name: "index_scripts_on_track_id"
  end

  create_table "searchable_directories", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name"
    t.integer "depth"
    t.uuid "parent_id"
    t.uuid "root_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_searchable_directories_on_name"
    t.index ["parent_id"], name: "index_searchable_directories_on_parent_id"
    t.index ["root_id"], name: "index_searchable_directories_on_root_id"
  end

  create_table "searchable_files", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name"
    t.string "file_extension"
    t.string "path"
    t.integer "depth"
    t.uuid "searchable_directory_id", null: false
    t.uuid "root_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_searchable_files_on_name"
    t.index ["root_id"], name: "index_searchable_files_on_root_id"
    t.index ["searchable_directory_id"], name: "index_searchable_files_on_searchable_directory_id"
  end

  create_table "sequences", force: :cascade do |t|
    t.integer "hits"
    t.integer "steps"
    t.integer "offset"
    t.float "custom_sequence", default: [], array: true
    t.bigint "track_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "order", default: 0, null: false
    t.index ["track_id", "order"], name: "index_sequences_on_track_id_and_order", unique: true
    t.index ["track_id"], name: "index_sequences_on_track_id"
  end

  create_table "track_controls", force: :cascade do |t|
    t.float "min"
    t.float "max"
    t.float "default_value"
    t.float "control_value"
    t.float "control_array_value", default: [], array: true
    t.string "control_string_value"
    t.text "node_attr"
    t.text "interface_name"
    t.text "node_type"
    t.integer "node_order"
    t.bigint "track_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.decimal "step_size"
    t.integer "current_unit_transform_idx", default: 0
    t.boolean "apply_hits_only", default: false
    t.integer "sequence_order", default: 0, null: false
    t.index ["track_id", "node_type", "node_order", "node_attr"], name: "index_track_controls_on_track_node_attr", unique: true
    t.index ["track_id"], name: "index_track_controls_on_track_id"
  end

  create_table "tracks", force: :cascade do |t|
    t.boolean "is_master", default: false
    t.integer "order"
    t.bigint "project_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "script_id"
    t.string "track_type", default: "sampler", null: false
    t.index ["project_id"], name: "index_tracks_on_project_id"
    t.index ["script_id"], name: "index_tracks_on_script_id"
  end

  create_table "user_roles", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id"
    t.bigint "project_id"
    t.integer "role"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["project_id"], name: "index_user_roles_on_project_id"
    t.index ["user_id"], name: "index_user_roles_on_user_id"
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "first_name"
    t.string "last_name"
    t.string "username", null: false
    t.string "email"
    t.jsonb "settings", default: {"roles"=>["user"]}, null: false
    t.string "encrypted_password", null: false
    t.string "password_salt", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at", precision: nil
    t.datetime "remember_created_at", precision: nil
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at", precision: nil
    t.datetime "last_sign_in_at", precision: nil
    t.inet "current_sign_in_ip"
    t.inet "last_sign_in_ip"
    t.integer "failed_attempts", default: 0, null: false
    t.string "unlock_token"
    t.datetime "locked_at", precision: nil
    t.datetime "discarded_at", precision: nil
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "project_id"
    t.index ["discarded_at"], name: "index_users_on_discarded_at"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["settings"], name: "index_users_on_settings", using: :gin
    t.index ["unlock_token"], name: "index_users_on_unlock_token", unique: true
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "allowlisted_jwts", "users", on_delete: :cascade
  add_foreign_key "filepath_controls", "tracks"
  add_foreign_key "preset_collections", "users", column: "creator_id", on_delete: :cascade
  add_foreign_key "projects", "users", column: "creator_id", on_delete: :cascade
  add_foreign_key "scripts", "presets"
  add_foreign_key "scripts", "tracks"
  add_foreign_key "searchable_directories", "searchable_directories", column: "parent_id", on_delete: :cascade
  add_foreign_key "searchable_directories", "searchable_directories", column: "root_id", on_delete: :cascade
  add_foreign_key "searchable_files", "searchable_directories"
  add_foreign_key "searchable_files", "searchable_directories", column: "root_id", on_delete: :cascade
  add_foreign_key "sequences", "tracks"
  add_foreign_key "track_controls", "tracks"
  add_foreign_key "tracks", "projects"
  add_foreign_key "user_roles", "projects"
  add_foreign_key "user_roles", "users"
end
