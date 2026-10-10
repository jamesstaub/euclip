require "rails_helper"

Rails.application.load_tasks

describe 'clean_jwts.rake' do
  it 'should remove expired JWTs' do
    create(:allowlisted_jwt)
    5.times { create(:allowlisted_jwt, exp: Time.current - rand(2..5).days) }

    expect { Rake::Task['clean_jwts'].invoke }.to change { AllowlistedJwt.all.size }.from(6).to(1)
  end
end