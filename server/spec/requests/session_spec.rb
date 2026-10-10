# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Session', type: :request do
  describe 'POST /login' do
    let(:login_url)     { '/login' }
    let!(:user)         { create(:user, username: 'testuser') }
    let(:params)        { { user: { login: 'testuser', password: '$Qwerty1' } } }
    let(:login_headers) { { 'Content-Type': APP_JSON, Accept:  APP_JSON } }

    describe 'success' do
      it 'should return status 200' do
        post login_url, params: params.to_json, headers: login_headers

        expect(response).to have_http_status(200)
      end

      it 'should return the logged in user' do
        post login_url, params: params.to_json, headers: login_headers
        jdata = json_parse(response.body)

        expect(jdata.dig(:data, :attributes, :username)).to eql('testuser')
      end
    end

    describe 'failure' do
      it 'should return status 401' do
        post login_url,
          params: { user: { login: 'testuser1', password: '$Qwerty1'} }.to_json,
          headers: login_headers

        expect(response).to have_http_status(401)
      end

      it 'should return the correct error message' do
        post login_url,
          params: { user: { login: 'testuser1', password: '$Qwerty1'} }.to_json,
          headers: login_headers
        jdata = json_parse(response.body)

        expect(jdata).to include(error: 'Invalid Login or password.')
      end
    end
  end

  describe 'DELETE /logout' do
    let(:logout_url) { '/logout' }

    before(:each) do
      login_user
    end

    describe 'success' do
      it 'should return status 200' do
        delete logout_url, headers: @headers

        expect(response).to have_http_status(200)
      end

      it 'should have the correct success message' do
        delete logout_url, headers: @headers
        jdata = json_parse(response.body)

        expect(jdata).to include(message: 'successfully logged out')
      end
    end

    describe 'failure' do
      after(:each) do
        Timecop.return
      end

      it 'should return status 500' do
        Timecop.travel(3.days)
        delete logout_url, headers: @headers

        expect(response).to have_http_status(500)
      end

      it 'should notify the user that the token has expired' do
        Timecop.travel(3.days)
        delete logout_url, headers: @headers

        expect(response.body).to match(/Signature has expired/)
      end

      it 'should notify the user the the token is invalid' do
        delete logout_url

        expect(response.body).to match(/Nil JSON web token/)
      end
    end
  end
end