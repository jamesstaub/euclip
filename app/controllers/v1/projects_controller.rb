class V1::ProjectsController < V1::BaseController
  before_action :set_project, only: %i[update]

  def index
    @pagy, @projects = pagy(Project.where(creator_id: params["user_id"]).order(created_at: :asc))
    render json: ProjectSerializer.new(
      @projects,
      {
        include: included_relations,
        meta: { pagination: pagy_metadata(@pagy) }
      }
    ), status: :ok
  end

  def show
    @project = Project.find_by(slug: params["slug"])
    render json: ProjectSerializer.new(
      @project,
      include: included_relations
    ), status: :ok
  end

  def create
    @project = Project.create_with_relations!(creator_id: current_user.id)
    if @project.save
      render json: ProjectSerializer.new(
        @project,
        include: included_relations
      ), status: :ok
    else
      render json: { errors: @project.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  def update
    @project.update(clean_params)
    if @project.save
      render json: ProjectSerializer.new(
        @project,
        include: included_relations
      ), status: :ok
    else
      render json: { errors: @project.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  private

  def set_project
    @project = Project.find(@data.require(:id))
  end
  
  def clean_params
    @attributes.permit(:title, :slug, :bpm)
  end
end