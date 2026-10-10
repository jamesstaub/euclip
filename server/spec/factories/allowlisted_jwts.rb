FactoryBot.define do
  factory :allowlisted_jwt do
    jti  { Digest::MD5.hexdigest([SecureRandom.uuid, SecureRandom.uuid].join(':')) }
    exp  { Time.current + 24.hours }
    aud  { nil }
    user { create(:user, :with_avatar) }
  end
end
