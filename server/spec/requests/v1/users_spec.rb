require 'rails_helper'

RSpec.describe 'V1::Users', type: :request do
  let(:user_path) { "/#{API_VERSION}/users" }
  let(:user)      { create(:user) }
  let(:a_user)    { create(:user, :with_avatar) }

  before(:each) do
    login_user
  end

  describe 'index' do
    before(:each) do
      user.save
      a_user.save
      get user_path, headers: @auth_header
    end

    it 'should return status 200' do
      expect(response).to have_http_status(200)
    end

    it 'should return an array of users' do
      jdata = json_parse(response.body)

      expect(jdata.dig(:data)).to be_an(Array)
      expect(jdata.dig(:data, 0, :type)).to eql('user')
    end

    it 'should return pagination metadata' do
      jdata = json_parse(response.body)

      expect(jdata.dig(:meta)).to include(:pagination)
    end
  end

  describe 'show' do
    it 'should return a success status' do
      get "#{user_path}/#{a_user.id}", headers: @auth_header

      expect(response).to have_http_status(200)
    end

    it 'should return a user' do
      get "#{user_path}/#{a_user.id}", headers: @auth_header
      jdata = json_parse(response.body)

      expect(jdata.dig(:data, :type)).to eql('user')
    end

    it "should return a user's links" do
      get "#{user_path}/#{a_user.id}", headers: @auth_header
      jdata = json_parse(response.body)

      expect(jdata.dig(:data, :links, :destroy_avatar, :method)).to eql('delete')
      expect(jdata.dig(:data, :links, :self, :url)).to eql("#{user_path}/#{a_user.id}")
      expect(jdata.dig(:data, :links, :avatar, :url)).to eql("#{user_path}/#{a_user.id}/avatar")
      expect(jdata.dig(:data, :links, :destroy_avatar, :url)).to eql('registrations/avatar')
    end

    it 'should return not_found if user ID is invalid' do
      get "#{user_path}/12345", headers: @auth_header
      jdata = json_parse(response.body)

      expect(jdata).to include(error: "Couldn't find User with 'id'=12345")
    end
  end

  describe 'avatar' do
    before(:each) do
      login_user
    end

    it 'should redirect to the avatar url' do
      get "#{user_path}/#{a_user.id}/avatar", headers: @auth_header

      expect(response).to have_http_status(302)
      expect(response.body).to match(/rails-logo1.png/)
      expect(response.body).to match(/redirected/)
    end

    it 'should return avatar_not_found' do
      @current_user.avatar.purge
      get "#{user_path}/#{user.id}/avatar", headers: @auth_header
      jdata = json_parse(response.body)

      expect(response).to have_http_status(404)
      expect(jdata).to include(error: 'An avatar is not attached to the user.')
    end
  end

  describe 'unauthorized' do
    it 'should return status 401' do
      get user_path

      expect(response).to have_http_status(401)
    end

    it 'should return unauthorized message' do
      get user_path
      jdata = json_parse(response.body)

      expect(jdata).to include(error: 'You need to sign in or sign up before continuing.')
    end
  end
end
