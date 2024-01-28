class V1::ProjectsController < V1::BaseController
  before_action :set_project_from_id, only: %i[update destroy]

  # Get a list of records
  def index
    @pagy, @projects = pagy(Project
                                  .includes(
                                    :tracks, 
                                    :tracks => :init_script, 
                                    :tracks => :onstep_script, 
                                    :tracks => :sequences
                                  )
                                  .where(creator_id: current_user.id)
                                  .order(created_at: :asc)
                            )
    render json: ProjectSerializer.new(
      @projects,
      {
        include: included_relations,
        meta: { pagination: pagy_metadata(@pagy) }
      }
    ), status: :ok
  end

  # Get a single record
  def show
    permitted = params.permit(:creator_id, :slug)
    @project = Project.find_by({slug: permitted[:slug], creator_id: permitted[:creator_id]})
    
    return render_not_found unless @project
    
    if can? :read, @project
      render json: ProjectSerializer.new(
        @project,
        include: included_relations
      ), status: :ok
    else
      render_unauthorized
    end
  end

  def create
    @project = Project.create_with_relations!(creator_id: current_user.id)
    if @project.save
      render json: ProjectSerializer.new(
        @project,
        include: included_relations
      ), status: :ok
    else
      render_unprocessable_entity(@project.errors)
    end
  end

  def update
    if can? :update, @project
      @project.update(clean_params)
      if @project.save
        render json: ProjectSerializer.new(
          @project,
          include: included_relations
        ), status: :ok
      else
        render_unprocessable_entity(@project.errors)
      end
    else
      render_unauthorized
    end
  end

  def destroy
    if can? :manage, @project
      @project.destroy
      render json: { meta: {} }, status: :ok
    end
  end

  private

  def set_project_from_id
    if @data
      project_id = @data.require(:id)
    else
      project_id = params.require(:id)
    end
    @project = Project.find(project_id)
  end
  
  # create/update parans
  def clean_params
    @attributes.permit(:title, :slug, :bpm, :access_level)
  end
end