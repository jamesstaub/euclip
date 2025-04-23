class AllowlistedJwt < ApplicationRecord
  include Devise::JWT::RevocationStrategies::Allowlist

  belongs_to :user

  validates :jti, :exp, :user_id, presence: true

  before_create :log_creation

  private

  def log_creation
    Rails.logger.info("Allowlisted JWT created: #{self.inspect}")
  end
end


