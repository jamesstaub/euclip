class UserRole < ApplicationRecord
  belongs_to :user
  belongs_to :project

  enum role: [:admin, :creator, :collaborator, :viewer]
end
