class Track < ApplicationRecord
  belongs_to :project
  has_one :init_script, :dependent => :destroy
  has_one :onstep_script, :dependent => :destroy
  has_many :track_controls, :dependent => :destroy

  attribute :hits, :integer, default: 4
  attribute :steps, :integer, default: 8
  attribute :offset, :integer, default: 0
  attribute :filepath, :string, default: '/SequentialCircuits%20Tom/kick.mp3'

  def self.create_with_relations(params)
    Track.transaction do
      track = self.create!(params)
      track.create_init_script!
      track.create_onstep_script!
      track
    end
  end
end