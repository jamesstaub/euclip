# frozen_string_literal: true

class UserAuthSerializer
  include FastJsonapi::ObjectSerializer
  set_key_transform :dash 
  attributes :provider, :uid, :access_token, :token_expires_at, :extra_data, :avatar_id
  belongs_to :user, serializer: UserSerializer

end
