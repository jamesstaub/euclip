# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AllowlistedJwt, type: :model do
  let(:alj) { build(:allowlisted_jwt) }

  describe 'object' do
    it { expect(alj).to be_valid }
  end

  context 'validations' do
    describe 'jti' do
      it 'should have error if NOT present' do
        alj = build(:allowlisted_jwt, jti: '')
        alj.save

        expect(alj.errors.full_messages).to include("Jti can't be blank")
      end
    end

    describe 'exp' do
      it 'should have error if NOT present' do
        alj = build(:allowlisted_jwt, exp: nil)
        alj.save

        expect(alj.errors.full_messages).to include("Exp can't be blank")
      end
    end

    describe 'user' do
      it 'should have error if NOT present' do
        alj = build(:allowlisted_jwt, user_id: nil)
        alj.save

        expect(alj.errors.full_messages).to include("User can't be blank")
        expect(alj.errors.full_messages).to include('User must exist')
      end
    end
  end
end