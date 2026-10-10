class SearchableFile < ApplicationRecord
  AUDIO_EXTENSIONS = ['wav', 'WAV', 'aif', 'mp3', 'AIFF']
  IMG_EXTENSIONS = ['jpg', 'jpeg', 'tiff', 'JPEG', 'gif', 'GIF', 'png', 'bmp']

  belongs_to :searchable_directory
  belongs_to :root, class_name: "SearchableDirectory", foreign_key: "root_id", optional: false
  scope :search_by_name, ->(name) { where('name ILIKE ?', "%#{name}%") }
  
  scope :audio_files, -> { where(file_extension: AUDIO_EXTENSIONS) }
  scope :img_files, -> { where(file_extension: IMG_EXTENSIONS) }
  scope :all_descendents_of, ->(root_id) { where(root_id: root_id) }

  def self.all_descendents_of(root_id)
    where(root_id: root_id)
  end

  def audio?
    AUDIO_EXTENSIONS.include? file_extension
  end
  
  def img?
    IMG_EXTENSIONS.include? file_extension
  end
end
