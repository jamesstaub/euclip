class V1::FilesController < ApplicationController
  respond_to :json

  def index
    path = URI.decode_www_form_component(request.path.gsub("/v1/files", ""))
    parts = path.split('/').reject(&:empty?)
    root_dir = SearchableDirectory.get_root
    top_dir = SearchableDirectory.find_by(name: parts.first, parent: root_dir)

    if parts.empty? || top_dir.nil?
      message = {
        error: "Error: Could not find any Directories"
      }
      render json: message, status: :internal_server_error and return
    else
      response = create_response(top_dir, parts, path)
    end

    render json: response
  end

  private

  # the top_dir passed in here will be a named folder like "Roland"
  # top level folder name, not the SearchableDirectory with the name "/"
  
  def create_response(top_dir, path_parts, path)
    descendents = SearchableDirectory.all_descendents_of(top_dir.id)
    files = SearchableFile.all_descendents_of(top_dir.id)
    ancestor_tree = []
    path_parts = (['/'] + path_parts)
    path_parts.each_with_index do |path_part, idx|
      dir = determine_dir(descendents, top_dir, path_part, idx)
      dirs, audio, images = get_children(dir)
      path_str = clean_path_str(path_part, path_parts, idx)
      ancestor_tree << {
        "dirs": dirs,
        "audio": audio,
        "img": images,
        "currentSelection": path_parts[idx+1] || '',
        "path": path_str,
      }
    end

    {
      "ancestor_tree": ancestor_tree,
    }.merge(ancestor_tree.last) # redundant but easier for the frontend
  end

  def get_children(item)
    dirs = SearchableDirectory.children_of(item).pluck(:name) || []
    audio = item.searchable_files.select{|i| i.audio?}.pluck(:name)
    images = item.searchable_files.select{|i| i.img?}.pluck(:name)
    [dirs, audio, images]
  end

  # top_dir is the named directory which is a direct child of the / directory
  # descendents are all directories that have top_dir as the root

  def determine_dir(descendents, top_dir, path_part, idx)
    dir = SearchableDirectory.get_root if path_part == '/'
    dir = top_dir if path_part == top_dir.name && idx == 1
    dir = descendents.find_by(name: path_part, depth: idx - 1) if dir.nil?

    dir
  end

  def clean_path_str(path_part, path_parts, idx)
    str = if path_part == '/'
      '/'
    else
      "/#{path_parts[0..idx].join('/')}/".gsub(/\/+/, '/')
    end
    str
  end



end 