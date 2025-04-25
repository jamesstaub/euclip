# frozen_string_literal: true

class UserSerializer
  include FastJsonapi::ObjectSerializer
  USER_PATH = "/#{API_VERSION}/users"

  attributes :first_name, :last_name, :username, :email, :settings,
             :avatar_metadata, :created_at, :updated_at

  has_one :user_auth

  link :self do |object|
    { url: "#{USER_PATH}/#{object.id}" }
  end

  link :avatar do |object|
    object.has_avatar? ?
      { url: "#{USER_PATH}/#{object.id}/avatar" } :
      nil
  end

  # link :destroy_avatar do |object|
  #   object.has_avatar? ?
  #     { method: 'delete', url: 'registrations/avatar' } :
  #     nil
  # end
end
