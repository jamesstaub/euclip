# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Password', type: :request do
  let(:password_url) { '/password' }
  let(:new_password) { '$Query2' }
  let(:headers)      { { 'Content-Type': APP_JSON, Accept:  APP_JSON } }

  before(:each) do
    login_user
    @raw, hashed = Devise.token_generator.generate(User, :reset_password_token)
    @current_user.reset_password_token = hashed
    @current_user.reset_password_sent_at = Time.current
    @current_user.save
  end

  describe 'PUT /password' do
    describe 'success' do
      let(:params) { {
        user: {
          password: new_password,
          reset_password_token: @raw
        }
      }.to_json }

      it 'should return status 204' do
        put password_url, params: params, headers: headers

        expect(response).to have_http_status(204)
      end

      it 'should return success message NO CONTENT' do
        put password_url, params: params, headers: headers

        expect(response.body).to eql('')
      end
    end

    describe 'failure' do
      let(:params) { { user: { password: new_password } } }

      it 'should return status 422' do
        put password_url, params: params.to_json, headers: headers

        expect(response).to have_http_status(422)
      end

      it 'should return failure message if reset_password_token is missing' do
        put password_url, params: params.to_json, headers: headers
        jdata = json_parse(response.body)

        expect(jdata).to include(errors: { reset_password_token: ["can't be blank"] })
      end

      it 'should return failure message if password is missing' do
        params = { user: { reset_password_token: @raw } }
        put password_url, params: params.to_json, headers: headers
        jdata = json_parse(response.body)

        expect(jdata).to include(errors: { password: ["can't be blank"] })
      end

      it 'should return message for expired token' do
        @current_user.reset_password_token = nil
        @current_user.reset_password_sent_at = nil
        @current_user.save
        params[:user][:reset_password_token] = @raw

        put password_url, params: params.to_json, headers: headers
        jdata = json_parse(response.body)

        expect(jdata).to include(errors: { reset_password_token: ['is invalid'] })
      end
    end
  end
end