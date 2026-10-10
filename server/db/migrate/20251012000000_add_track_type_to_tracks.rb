# Which kind of track this is (see TrackType): sampler, looped_sampler, multi_sampler, polysynth...
# Existing tracks are plain samplers.
class AddTrackTypeToTracks < ActiveRecord::Migration[7.0]
  def change
    add_column :tracks, :track_type, :string, null: false, default: 'sampler'
  end
end
