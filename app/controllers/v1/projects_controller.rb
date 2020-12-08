class V1::ProjectsController < ApplicationController
  def index
    @pagy, @projects = pagy(Project.where(creator_id: params["user_id"]).order(created_at: :asc))
    render json: ProjectSerializer.new(
      @projects,
      { meta: { pagination: pagy_metadata(@pagy) } }
    ), status: :ok
  end

  def create
    @project = Project.new(creator: current_user)
    if @project.save
      render json: ProjectSerializer.new(
        @project
      ), status: :ok
    else
      render json: { errors: @project.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end
end