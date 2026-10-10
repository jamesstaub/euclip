# :nocov:
module Timer
  def self.runtime(start_time)
    total_time     = time_tag - start_time
    hours          = (total_time / ( 1000 * 60 * 60 )) % 24
    minutes        = (total_time / ( 1000 * 60 ) ) % 60
    seconds        = (total_time / 1000 ) % 60
    milliseconds   = (total_time % 1000)

    puts "Total runtime: #{hours}h #{minutes}m #{seconds}s #{milliseconds}ms"
  end

  def self.time_tag
    (Time.now.to_f * 1000.0).to_i
  end
end
# :nocov: