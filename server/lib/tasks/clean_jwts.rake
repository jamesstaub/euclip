# frozen_string_literal: true

require 'timer'

desc 'Deletes expired JWTs records'
task clean_jwts: :environment do
  print 'Cleaning up expired JWTs, please wait... '

  start_time = Timer.time_tag
  AllowlistedJwt.where('exp < ?', Time.current).delete_all
  Timer.runtime(start_time)
end