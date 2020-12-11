class Track < ApplicationRecord
  belongs_to :project
  has_one :init_script
  has_one :onstep_script

  def self.create_with_relations(params)
    init_script = InitScript.create!
    onstep_script = OnstepScript.create!
    params.merge!({ init_script: init_script, onstep_script: onstep_script })
    Track.create(params)
  end
end
