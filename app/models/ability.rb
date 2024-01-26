# frozen_string_literal: true

class Ability
  include CanCan::Ability

  def initialize(user)
    user ||= User.new

    can :manage, Project, role_authorization(user, 'creator')
    can [:read, :update, :destroy], Project, role_authorization(user, 'collaborator')
    can :read, Project, role_authorization(user, 'viewer')

    can :manage, [Track], project: role_authorization(user, 'creator')
    can [:read, :update], [Track], project: role_authorization(user, 'collaborator')
    can :read, [Track], project: role_authorization(user, 'viewer')
  end

  def role_authorization(user, role)
    { user_roles: { user_id: user.id, role: role }}
  end
end
