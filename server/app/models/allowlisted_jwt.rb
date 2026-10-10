class AllowlistedJwt < ApplicationRecord
  belongs_to :user

  validates :jti, :exp, :user_id, presence: true
end
