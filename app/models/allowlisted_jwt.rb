class AllowlistedJwt < ApplicationRecord
  include Devise::JWT::RevocationStrategies::Allowlist

  belongs_to :user

  validates :jti, :exp, :user_id, presence: true
end


