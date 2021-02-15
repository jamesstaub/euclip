# frozen_string_literal: true

class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::Allowlist
  include Discard::Model
  store_accessor :settings, :roles

  # Include default devise modules. Others available are:
  # :confirmable, :timeoutable, :lockable, and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable, :trackable,
         :encryptable, :jwt_authenticatable,
         jwt_revocation_strategy: self, stretches: 20,
         authentication_keys: [:login]

  has_many :projects, foreign_key: "creator_id"
  
  has_one_attached :avatar

  before_create :add_user_role, if: lambda { |u| u.settings.blank? }
  before_save :capitalize_names

  validates :email,
    uniqueness: { case_sensitive: false },
    allow_nil: true,
    allow_blank: true,
    format: { with: URI::MailTo::EMAIL_REGEXP, message: FORMAT_INVALID },
    presence: false

  validates :username,
    uniqueness: { case_sensitive: false },
    presence: true

  validate :username_is_not_an_existing_email, if: lambda { |u| u.username =~ /@/ }

  PASSWORD_FORMAT = /\A.*(?=.*[a-z])(?=.*[A-Z]).*\z/
  PW_MESSAGE = 'must include 1 CAP char, 1 low char'

  validates :password,
    format: { with: PASSWORD_FORMAT, message: PW_MESSAGE },
    confirmation: true,
    presence: true,
    on: :create

  validates :password,
    format: { with: PASSWORD_FORMAT, message: PW_MESSAGE },
    confirmation: true,
    allow_blank: true,
    on: :update

  validates :avatar,
    content_type: [:png, :jpg, :jpeg],
    size: { less_than: 1.megabyte , message: 'file size should be less than 1mb' }

  def active_for_authentication?
    super && !discarded?
  end

  def avatar_metadata
    return nil unless has_avatar?

    avatar.blob.metadata.except(:identified, :analyzed).merge!(
      byte_size: avatar.blob.byte_size.to_i,
      name: avatar.blob.filename.to_s,
    )
  end

  def has_avatar?
    avatar&.attached?
  end
  alias_method :avatar?, :has_avatar?

  def full_name
    "#{first_name} #{last_name}"
  end

  def list_name
    "#{last_name}, #{first_name}"
  end

  # see lib/devise/models/validatable.rb#L29 for optional email
  def email_required?
    false
  end

  private

  def add_user_role
    settings.merge!(roles: ['user', 'admin']) if settings.blank?
  end

  def capitalize_names
    self.first_name &&= first_name.capitalize
    self.last_name &&= last_name.capitalize
  end

  def self.find_for_database_authentication(warden_conditions)
    conditions = warden_conditions.dup
    if login = conditions.delete(:login)
      where(conditions.to_hash).where(
        ['lower(username) = :value OR lower(email) = :value', { value: login.downcase }]
      ).first
    elsif conditions.has_key?(:username) || conditions.has_key?(:email)
      where(conditions.to_hash).first
    end
  end

  def username_is_not_an_existing_email
    errors.add(:username, :invalid) if User.where(email: username).exists?
  end
end
