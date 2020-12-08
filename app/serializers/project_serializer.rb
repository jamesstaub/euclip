class ProjectSerializer
  include FastJsonapi::ObjectSerializer
  USER_PATH = "/#{API_VERSION}/users"

  attributes :id, :title, :created_at, :slug, :bpm
  belongs_to :creator, record_type: :user
end
