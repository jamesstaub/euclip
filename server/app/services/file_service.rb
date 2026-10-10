class FileService

  # creates db records from a path like: "Jomox Xbase 09/Jomox Xbase-09/BassDr01.wav"
  def self.create_record(file_path)
    parts = file_path.split('/').filter(&:present?)
    current_directory = nil
    root = nil

    ActiveRecord::Base.transaction do
      root_directory = SearchableDirectory.find_by(name: '/')
      parts.each_with_index do |part, index|
        all_but_last = parts.length - 1
        if index.zero? # top level named directory 
          root = current_directory = SearchableDirectory.find_or_create_by(name: part,
                                                                          depth: index,
                                                                          parent_id: root_directory.id,
                                                                          root_id: root_directory.id
                                                                          )
        elsif index != all_but_last
          current_directory = SearchableDirectory.find_or_create_by(name: part, 
                                                                    parent: current_directory, 
                                                                    root_id: root&.id, 
                                                                    depth: index)
        end

        if index == all_but_last
          file_name = part
          file_extension = File.extname(file_name).delete_prefix('.')
          next unless file_extension.present?

          file_extension.downcase!
          SearchableFile.create(name: file_name, 
                                file_extension: file_extension, 
                                searchable_directory: current_directory, 
                                root_id: root&.id, 
                                depth: index,
                                path: file_path
                              )
        end
      end
    end
  end

  def self.perform_search(query, page)
    # TODO: pagination not fully implemented, need to pass total pages to client
    page_size = 500
    offset = page * page_size

    searchable_files = SearchableFile
                      .includes(:root)
                      .where("LOWER(path) LIKE LOWER(?)", "%#{SearchableFile.sanitize_sql_like(query.to_s)}%")
                      .offset(offset)
                      .limit(page_size)

    # Group results by folder
    grouped_results = searchable_files.group_by { |file| 
      file.root&.name || '/' 
    }

    # Format the results as needed
    formatted_results = grouped_results.map do |folder, files|
      {
        folder: folder,
        files: files.map do |file|
          {
            filename: file.name,
            path: file.path.start_with?('/') ? file.path : "/#{file.path}"

          }
        end
      }
    end

    formatted_results
  end

end