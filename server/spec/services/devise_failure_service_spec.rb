# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'DeviseFailureService', type: :request do
  before(:each) do
    login_user
  end

  it 'should return an expected error' do
    set_auth_with_bad_jti
    @headers[:Authorization] = @auth
    put '/registration', params: { user: { username: 'newusername', current_password: '$Qwerty1' } }.to_json, headers: @headers
    jdata = json_parse(response.body)

    expect(jdata).to include(error: 'Missing jti')
  end
end