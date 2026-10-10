class SearchableDirectory < ApplicationRecord
  validates_uniqueness_of :name, if: -> { name == '/' }
  validates :name, uniqueness: { scope: :parent_id, if: :top_level_directory? }

  has_many :searchable_files, dependent: :destroy
  has_many :audio_files, -> { SearchableFile.audio_files }, class_name: 'SearchableFile'
  has_many :img_files, -> { SearchableFile.img_files }, class_name: 'SearchableFile'
  has_many :subdirectories, class_name: "SearchableDirectory", foreign_key: "parent_id", dependent: :destroy
  
  belongs_to :parent, class_name: "SearchableDirectory", foreign_key: "parent_id", optional: true
  belongs_to :root, class_name: "SearchableDirectory", foreign_key: "root_id", optional: true

  def self.get_root
    find_by(name: '/')
  end

  def self.children_of(parent_id)
    where(parent_id: parent_id)
  end
  
  def self.all_descendents_of(root_id)
    where(root_id: root_id)
  end

  def top_level_directory?
    parent_id.nil?
  end
end
