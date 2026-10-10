# The kinds of track the "New Track" menu offers (see TrackType). Read-only.
class V1::TrackTypesController < ApplicationController
  before_action ->{ authenticate_user!(force: true) }

  def index
    render json: {
      data: TrackType.all.map do |type|
        {
          id: type.key,
          type: 'track-types',
          attributes: {
            title: type.title,
            description: type.description,
            # applied by the client once the track's audio exists
            controls: type.controls,
            sequences: type.sequences,
          },
        }
      end,
    }
  end
end
