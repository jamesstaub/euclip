# frozen_string_literal: true

module Avatarable
  include ActiveSupport::Concern

  private

  def render_avatar_not_found
    render json: { error: 'An avatar is not attached to the user.' }, status: :not_found
  end
end