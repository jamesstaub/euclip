# A project-wide script, run before the tracks' scripts, where macros are registered (see MacrosScript).
# It is a script that belongs to a project instead of a track, so `track_id` stays nullable.
class AddMacrosScriptToProjects < ActiveRecord::Migration[7.0]
  class MigrationScript < ActiveRecord::Base
    self.table_name = 'scripts'
    self.inheritance_column = nil
  end

  class MigrationProject < ActiveRecord::Base
    self.table_name = 'projects'
  end

  def up
    add_reference :scripts, :project, foreign_key: true, null: true, index: true

    # existing projects get the starting script too
    default = "/**\n  MACROS: runs before every track's setup script. Describe the macros this project uses here, once.\n  Open the Macros menu to load a documented example.\n**/\n"
    MigrationProject.find_each do |project|
      MigrationScript.create!(type: 'MacrosScript', project_id: project.id, safe_code: default, editor_content: default)
    end
  end

  def down
    MigrationScript.where(type: 'MacrosScript').delete_all
    remove_reference :scripts, :project, foreign_key: true, index: true
  end
end
