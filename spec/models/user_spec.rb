# frozen_string_literal: true

require 'rails_helper'

RSpec.describe User, type: :model do
  let(:user)           { build(:user, :with_avatar) }
  let(:d_user)         { build(:user, discarded_at: Time.current) }
  let(:user_no_roles)  { build(:user, :without_roles) }

  describe 'object' do
    it { expect(user).to be_valid }
  end

  describe 'stored accessors' do
    describe 'settings' do
      it 'should return the expected content' do
        expect(user.settings).to include('roles' => ['user'])
        expect(user.roles).to be_a(Array)
      end

      it 'should updated values' do
        user.roles << 'admin'
        user.save

        expect(user.roles).to include('admin')
      end
    end
  end

  describe 'avatar' do
    it { expect(user.avatar).to be_attached }
    it { expect(d_user.avatar).not_to be_attached }
  end

  describe 'associations' do
    # add association tests here
  end

  context 'callbacks' do
    describe 'before_create' do
      it 'should add user role if no roles exist' do
        user_no_roles.save
        expect(user_no_roles.roles).to include('user')
      end
    end

    describe 'before_save' do
      it 'should capitalize first and last name' do
        user = create(:user, first_name: 'sponge', last_name: 'bob')

        expect(user.first_name).to eql('Sponge')
        expect(user.last_name).to eql('Bob')
      end
    end

    describe 'on save' do
      # devise does this callback
      it 'should downcase the email' do
        user = create(:user, email: 'TeSt.emAil1@gmail.com')

        expect(user.email).to eql('test.email1@gmail.com')

        user.email = 'TEST.User.eMAIl@GMAIL.com'
        user.save

        expect(user.email).to eql('test.user.email@gmail.com')
      end
    end
  end

  context 'validations' do
    describe 'avatar' do
      it 'should have error if file size is too big' do
        user = build(:user, :with_large_avatar)
        user.save

        expect(user.errors.full_messages).to include('Avatar file size should be less than 1mb')
      end

      it 'should have error if file is the wrong type' do
        user = build(:user, :with_bmp_avatar)
        user.save

        expect(user.errors.full_messages).to include('Avatar has an invalid content type')
      end
    end

    describe 'first_name' do
      it 'should have error if NOT present' do
        user = build(:user, first_name: '')
        user.save

        expect(user.errors.full_messages).to include("First name can't be blank")
      end
    end

    describe 'last_name' do
      it 'should have error if NOT present' do
        user = build(:user, last_name: '')
        user.save

        expect(user.errors.full_messages).to include("Last name can't be blank")
      end
    end

    describe 'username' do
      it 'should have error if NOT present' do
        user = build(:user, username: '')
        user.save

        expect(user.errors.full_messages).to include("Username can't be blank")
      end

      it "should have error if the username is the same as another user's email" do
        create(:user, email: 'test.email@gmail.com')
        user = user = build(:user, username: 'test.email@gmail.com')
        user.save

        expect(user.errors.full_messages).to include("Username is invalid")
      end

      it 'should have error if NOT unique on create' do
        create(:user, username: 'test_user1')
        user = build(:user, username: 'test_user1')
        user.save

        expect(user.errors.full_messages).to include("Username has already been taken")
      end

      it 'should have error if NOT unique on update' do
        create(:user, username: 'test_user1')
        user = create(:user, username: 'test_user2')
        user.username = 'test_user1'
        user.save

        expect(user.errors.full_messages).to include("Username has already been taken")
      end
    end

    describe 'email' do
      it 'should have error if NOT valid' do
        user = build(:user, email: 'user@.yahoo.com')
        user.save

        expect(user.errors.full_messages).to include("Email format is invalid")
      end

      it 'should have error if NOT unique on create' do
        create(:user, email: 'test.email1@gmail.com')
        user = build(:user, email: 'test.email1@gmail.com')
        user.save

        expect(user.errors.full_messages).to include("Email has already been taken")
      end

      it 'should have error if NOT unique on update' do
        create(:user, email: 'test.email1@gmail.com')
        user = create(:user, email: 'test.email2@gmail.com')
        user.email = 'test.email1@gmail.com'
        user.save

        expect(user.errors.full_messages).to include("Email has already been taken")
      end
    end

    describe 'password' do
      let(:char_message) { "Password must include 1 special char @\#$%^&+=, 1 CAP char, 1 low char" }

      describe 'on create' do
        it 'should have error if NOT the correct length' do
          user = build(:user, password: '$1Go', password_confirmation: '$1Go')
          user.save

          expect(user.errors.full_messages).to include('Password is too short (minimum is 6 characters)')
        end

        it 'should have a special character' do
          user = build(:user, password: '1GoGoGo', password_confirmation: '1GoGoGo')
          user.save

          expect(user.errors.full_messages).to include(char_message)
        end

        it 'should have an uppercase char' do
          user = build(:user, password: '$1gogo', password_confirmation: '$1gogo')
          user.save

          expect(user.errors.full_messages).to include(char_message)
        end

        it 'should have a lowercase char' do
          user = build(:user, password: '$1GOGO', password_confirmation: '$1GOGO')
          user.save

          expect(user.errors.full_messages).to include(char_message)
        end

        it 'should have a number' do
          user = build(:user, password: '$GoGoGo', password_confirmation: '$GoGoGo')
          user.save

          expect(user.errors.full_messages).to include(char_message)
        end
      end

      describe 'on update' do
        before(:each) do
          user.save
        end

        it 'should be the correct length' do
          user.update(password: '$1Go', password_confirmation: '$1Go')

          expect(user.errors.full_messages).to include('Password is too short (minimum is 6 characters)')
        end

        it 'should have a special character' do
          user.update(password: '1GoGoGo', password_confirmation: '1GoGoGo')

          expect(user.errors.full_messages).to include(char_message)
        end

        it 'should have an uppercase char' do
          user.update(password: '$1gogo', password_confirmation: '$1gogo')

          expect(user.errors.full_messages).to include(char_message)
        end

        it 'should have a lowercase char' do
          user.update(password: '$1GOGO', password_confirmation: '$1GOGO')

          expect(user.errors.full_messages).to include(char_message)
        end

        it 'should have a number' do
          user.update(password: '$GoGoGo', password_confirmation: '$GoGoGo')

          expect(user.errors.full_messages).to include(char_message)
        end
      end
    end
  end

  context 'scopes' do
    before(:each) do
      user.save
      d_user.save
    end

    describe 'discarded' do
      it 'should return the discarded ' do
        expect(User.discarded).to include(d_user)
        expect(User.discarded).not_to include(user)
      end
    end

    describe 'kept' do
      it 'should return the kept' do
        expect(User.kept).to include(user)
        expect(User.kept).not_to include(d_user)
      end
    end
  end

  context 'class methods' do
    # add class methods here
  end

  context 'instance methods' do
    describe 'active_for_authentication?' do
      it 'should return true' do
        expect(user.active_for_authentication?).to be_truthy
      end

      it 'should return false' do
        expect(d_user.active_for_authentication?).to be_falsey
      end
    end

    describe 'avatar_metadata' do
      it 'should return nil' do
        user = build_stubbed(:user)
      end

      it 'should return expected metadata' do
        user.save

        expect(user.avatar_metadata).to include(:byte_size, :name)
      end

      it 'should exclude default blob metadata' do
        user.save

        expect(user.avatar_metadata).not_to include(:identified, :analyzed)
      end
    end

    describe 'has_avatar?' do
      it 'should return false' do
        user = build(:user)

        expect(user.has_avatar?).to be_falsey
      end

      it 'should return true' do
        expect(user.has_avatar?).to be_truthy
      end
    end

    describe 'full_name' do
      it { expect(user.full_name).to eql("#{user.first_name} #{user.last_name}") }
    end

    describe 'list_name' do
      it { expect(user.list_name).to eql("#{user.last_name}, #{user.first_name}") }
    end
  end
end
