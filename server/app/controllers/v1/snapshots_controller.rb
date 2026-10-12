# Snapshots of a project: complete, switchable states (tracks + tempo). Edits apply to the active snapshot;
# create clones one; activate makes one the active snapshot.
class V1::SnapshotsController < V1::BaseController
  include LenientJsonApiParams

  before_action :set_project, only: %i[create]
  before_action :set_snapshot, only: %i[show update destroy activate]
  before_action :authorize_writes, only: %i[create update destroy activate]

  # GET /v1/snapshots/:id?include=tracks,tracks.sequences,...
  # One snapshot with its tracks, so a snapshot that isn't active can be loaded in the background.
  def show
    render json: SnapshotSerializer.new(@snapshot, include: included_relations), status: :ok
  end

  # POST /v1/projects/:project_slug/snapshots
  # Clones the active snapshot (or `relationships.source`) under the given name.
  def create
    source = source_snapshot
    return render_not_found unless source

    snapshot = source.clone!(name: @attributes[:name])
    render json: SnapshotSerializer.new(snapshot, include: included_relations), status: :ok
  rescue ActiveRecord::RecordInvalid => e
    render_unprocessable_entity(e.record.errors)
  end

  def update
    attrs = @attributes.permit(:name, :bpm).to_h
    ActiveRecord::Base.transaction do
      @snapshot.update!(attrs) if attrs.present?
      move_to(@attributes[:position].to_i) if @attributes.key?(:position)
    end
    render json: SnapshotSerializer.new(@snapshot.reload), status: :ok
  rescue ActiveRecord::RecordInvalid => e
    render_unprocessable_entity(e.record.errors)
  end

  def destroy
    @snapshot.destroy_and_reassign!
    render json: ProjectSerializer.new(@project.reload, include: included_relations), status: :ok
  rescue ActiveRecord::RecordNotDestroyed
    @snapshot.errors.add(:base, 'A project needs at least one snapshot')
    render_unprocessable_entity(@snapshot.errors)
  end

  # POST /v1/snapshots/:id/activate
  def activate
    @project.update!(active_snapshot: @snapshot)
    render json: ProjectSerializer.new(@project.reload, include: included_relations), status: :ok
  end

  private

  def set_project
    @project = Project.find_by(slug: params.require(:project_slug), creator_id: current_user.id)
    raise ActiveRecord::RecordNotFound unless @project
  end

  def set_snapshot
    @snapshot = Snapshot.includes(:project).find(params[:id])
    @project = @snapshot.project
    return render_forbidden unless can? :view, @project
  end

  def authorize_writes
    return render_forbidden unless can? :update, @project
  end

  def source_snapshot
    source_id = @relationships.dig(:source, :data, :id)
    source_id ? @project.snapshots.find_by(id: source_id) : @project.active_snapshot
  end

  # move this snapshot to a 0-based position, keeping positions dense and unique
  def move_to(position)
    ids = @project.snapshots.pluck(:id) - [@snapshot.id]
    ids.insert([[position, 0].max, ids.length].min, @snapshot.id)
    # positions are unique per project: park everything out of the way before assigning final values
    Snapshot.where(project_id: @project.id).update_all('position = position + 100000')
    ids.each_with_index { |id, index| Snapshot.where(id: id).update_all(position: index) }
  end
end
