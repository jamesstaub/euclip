FactoryBot.define do
  factory :user do
    first_name { Faker::Name.first_name }
    last_name  { Faker::Name.last_name }
    email      { Faker::Internet.safe_email(name: "#{first_name}#{last_name}+#{rand(1..9999)}") }
    username   { email.split('@')[0] }
    settings   { { roles: %w[user] } }
    password   { '$Qwerty1' }
    password_confirmation { '$Qwerty1' }


    trait :with_avatar do
      after :build do |user|
        file_name = 'rails-logo1.png'
        file_path = Rails.root.join('spec', 'fixtures', 'images', file_name)
        user.avatar.attach(
          io: File.open(file_path),
          filename: file_name,
          content_type: 'image/png'
        )
      end
    end

    trait :with_bmp_avatar do
      after :build do |user|
        file_name = 'rails-logo1.bmp'
        file_path = Rails.root.join('spec', 'fixtures', 'images', file_name)
        user.avatar.attach(
          io: File.open(file_path),
          filename: file_name,
          content_type: 'image/bmp'
        )
      end
    end

    trait :with_large_avatar do
      after :build do |user|
        file_name = 'dark-knight1.jpg'
        file_path = Rails.root.join('spec', 'fixtures', 'images', file_name)
        user.avatar.attach(
          io: File.open(file_path),
          filename: file_name,
          content_type: 'image/jpg'
        )
      end
    end

    trait :without_roles do
      settings { {} }
    end
  end
end
