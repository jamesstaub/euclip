# The project sample pool: the samples a project uses, shared by all of its snapshots.
class V1::ProjectSamplesController < V1::BaseController
  include LenientJsonApiParams

  before_action :set_project, only: %i[index create]
  before_action :set_sample, only: %i[update destroy]
  before_action :authorize_writes, only: %i[create update destroy]

  def index
    render json: ProjectSampleSerializer.new(@project.project_samples.includes(filepath_controls: :track)), status: :ok
  end

  # body: { path:, label? }. Adding a path that is already in the pool returns the existing entry.
  def create
    sample = ProjectSample.find_or_add!(@project, @attributes.require(:path))
    sample.update!(label: @attributes[:label]) if @attributes[:label].present? && @attributes[:label] != sample.label
    render json: ProjectSampleSerializer.new(sample), status: :ok
  rescue ActiveRecord::RecordInvalid => e
    render_unprocessable_entity(e.record.errors)
  end

  def update
    if @sample.update(@attributes.permit(:label, :position, :onset_threshold))
      render json: ProjectSampleSerializer.new(@sample), status: :ok
    else
      render_unprocessable_entity(@sample.errors)
    end
  end

  # refused while any track (in any snapshot) still uses it
  def destroy
    if @sample.destroy
      render json: { meta: {} }, status: :ok
    else
      render_unprocessable_entity(@sample.errors)
    end
  end

  private

  def set_project
    @project = Project.find_by(slug: params.require(:project_slug), creator_id: current_user.id)
    raise ActiveRecord::RecordNotFound unless @project
    return render_forbidden unless can? :view, @project
  end

  def set_sample
    @sample = ProjectSample.includes(:project).find(params[:id])
    @project = @sample.project
    return render_forbidden unless can? :view, @project
  end

  def authorize_writes
    return render_forbidden unless can? :update, @project
  end
end
