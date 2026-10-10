# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Registration', type: :request do
  let(:registration_url) { '/registration' }

  describe 'POST /registration' do
    let(:params) { {
      user: {
        first_name: Faker::Name.first_name,
        last_name:  Faker::Name.last_name,
        username:   Faker::Internet.username(specifier: 8),
        email:      Faker::Internet.safe_email,
        password:   '$Qwerty1',
        password_confirmation: '$Qwerty1',
      }
    } }

    describe 'success' do
      it 'should return status 201' do
        post registration_url, params: params
        expect(response).to have_http_status(201)
      end

      it "should return the new user's data" do
        post registration_url, params: params
        jdata = json_parse(response.body)

        expect(jdata.dig(:data, :type)).to eql('user')
        expect(jdata.dig(:data, :attributes, :first_name)).to eql(params.dig(:user, :first_name))
      end
    end

    describe 'failure' do
      it 'should return status 422' do
        post registration_url
        expect(response).to have_http_status(422)
      end

      it 'should return error messages' do
        post registration_url, headers: @auth_header
        jdata = json_parse(response.body)

        expect(jdata[:errors]).to include("Email can't be blank")
        expect(jdata[:errors]).to include("Email format is invalid")
        expect(jdata[:errors]).to include("Password can't be blank")
        expect(jdata[:errors]).to include("Password must include 1 special char @\#$%^&+=, 1 CAP char, 1 low char")
        expect(jdata[:errors]).to include("First name can't be blank")
        expect(jdata[:errors]).to include("Last name can't be blank")
        expect(jdata[:errors]).to include("Username can't be blank")
      end
    end
  end

  describe 'PUT /registration' do
    before(:each) do
      login_user
    end

    describe 'success' do
      let(:params)  { { user: { current_password: '$Qwerty1', username: 'newusername' } } }
      let(:avatar) { fixture_file_upload('images/rails-logo1.png') }
      let(:avatar2) { fixture_file_upload('images/rails-logo2.png') }

      it 'should return status 201' do
        put registration_url, params: params, headers: @auth_header

        expect(response).to have_http_status(201)
      end

      it "should return the updated user's data" do
        put registration_url, params: params, headers: @auth_header
        jdata = json_parse(response.body)

        expect(jdata.dig(:data, :attributes, :username)).to eql('newusername')
      end

      it 'should save an avatar' do
        params[:user].merge!(avatar: avatar)
        put registration_url, params: params, headers: @auth_header
        jdata = json_parse(response.body)

        expect(response.status).to be(201)
        expect(jdata.dig(:data, :attributes, :avatar_metadata)).not_to be_nil
      end

      it 'should update an avatar' do
        params[:user].merge!(avatar: avatar)
        put registration_url, params: params, headers: @auth_header

        params[:user].delete(:avatar)
        params[:user].merge!(avatar: avatar2)
        put registration_url, params: params, headers: @auth_header
        jdata = json_parse(response.body)

        expect(jdata.dig(:data, :attributes, :avatar_metadata, :name)).to eql('rails-logo2.png')
      end
    end

    describe 'failure' do
      let(:params) { { user: { current_password: '$Qwerty1'} } }

      it 'should return status 422' do
        put registration_url, params: { user: { username: 'newusername' } }, headers: @auth_header

        expect(response).to have_http_status(422)
      end

      it 'should return error if current_password is missing' do
        put registration_url, params: { user: { username: 'newusername' } }, headers: @auth_header
        jdata = json_parse(response.body)

        expect(jdata).to include(error: 'The current_password is missing or incorrect.')
      end

      it 'should return error if current_password is incorrect' do
        params[:user][:current_password] = 'dog'
        params[:user].merge!({email: 'new_cool_email@gmail.com'})
        put registration_url, params: params, headers: @auth_header
        jdata = json_parse(response.body)

        expect(jdata).to include(error: 'The current_password is missing or incorrect.')
      end

      it 'should return error if email is not formatted correctly' do
        params[:user].merge!({email: 'this.fake@.bad.com'})
        put registration_url, params: params, headers: @auth_header
        jdata = json_parse(response.body)

        expect(jdata[:errors]).to include('Email format is invalid')
      end

      it 'should return error if email already exists' do
        create(:user, email: 'test_email1@gmail.com')
        params[:user].merge!({email: 'test_email1@gmail.com'})
        put registration_url, params: params, headers: @auth_header
        jdata = json_parse(response.body)

        expect(jdata[:errors]).to include('Email has already been taken')
      end

      it 'should return error if username is the same as an existing email' do
        create(:user, email: 'test_email1@gmail.com')
        params[:user].merge!({email: 'test_email1@gmail.com'})
        put registration_url, params: params, headers: @auth_header
        jdata = json_parse(response.body)

        expect(jdata[:errors]).to include('Email has already been taken')
      end

      it 'should return error if the token is expired' do
        Timecop.travel(3.days)
        put registration_url, params: params, headers: @auth_header
        jdata = json_parse(response.body)

        expect(jdata).to include(error: 'Signature has expired')
        Timecop.return
      end
    end
  end

  describe 'DELETE /registration' do
    before(:each) do
      login_user
    end

    let(:params) { { user: { current_password: '$Qwerty1' } } }

    describe 'success' do
      it 'should return status 200' do
        delete registration_url, params: params, headers: @auth_header

        expect(response).to have_http_status(200)
      end

      it 'should return the expected success message' do
        delete registration_url, params: params, headers: @auth_header
        jdata = json_parse(response.body)

        expect(jdata).to include(message: 'User was successfully deactivated.')
      end

      it 'should remove all user sessions' do
        5.times { create(:allowlisted_jwt, user: @current_user, exp: 2.hours.ago) }
        delete registration_url, params: params, headers: @auth_header
        jdata = json_parse(response.body)

        expect(jdata).to include(message: 'User was successfully deactivated.')
        expect(AllowlistedJwt.find_by(user: @current_user)).to be_nil
      end
    end

    describe 'failure' do
      before(:each) do
        allow_any_instance_of(User).to receive(:discard!).and_return(false)
      end

      it 'should return status 500' do
        delete registration_url, params: params, headers: @auth_header

        expect(response).to have_http_status(500)
      end

      it "should return error message if user isn't deactivated" do
        delete registration_url, params: params, headers: @auth_header
        jdata = json_parse(response.body)

        expect(jdata[:error]).to match(/There was an error deactivating user/)
      end
    end
  end

  describe 'destroy_avatar' do
    before(:each) do
      login_user
    end

    let(:avatar_url) { '/registration/avatar' }
    let(:params) { { user: { current_password: '$Qwerty1' } } }

    it 'should return success status' do
      delete avatar_url, params: params, headers: @auth_header

      expect(response).to have_http_status(200)
    end

    it 'should return success message' do
      delete avatar_url, params: params, headers: @auth_header
      @current_user.reload
      jdata = json_parse(response.body)

      expect(jdata).to include(message: 'Avatar was successfully deleted.')
      expect(@current_user.has_avatar?).to be_falsey
    end

    it 'should return the correct status and message if unable to delete avatar' do
      allow_any_instance_of(User).to receive(:has_avatar?).and_return(true)
      delete avatar_url, params: params, headers: @auth_header
      jdata = json_parse(response.body)

      expect(response).to have_http_status(500)
      expect(jdata).to include(error: 'The server was unable to delete the avatar.')
    end

    it 'should return error message if current_password is missing' do
      delete avatar_url, headers: @auth_header
      jdata = json_parse(response.body)

      expect(jdata).to include(error: 'The current_password is missing or incorrect.')
    end

    it 'should return error message if current_password is invalid' do
      delete avatar_url, params: { user: { current_password: '$Dogs1' } }, headers: @auth_header
      jdata = json_parse(response.body)

      expect(jdata).to include(error: 'The current_password is missing or incorrect.')
    end
  end
end
