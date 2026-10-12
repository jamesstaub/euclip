# Snapshots of a project: saved tempo + track settings (`data`), switchable without touching the audio.
# The client captures the settings when it saves or leaves a snapshot and applies them when it switches;
# the server stores them and remembers which snapshot is active.
class V1::SnapshotsController < V1::BaseController
  include LenientJsonApiParams

  before_action :set_project, only: %i[create]
  before_action :set_snapshot, only: %i[update destroy activate]
  before_action :authorize_writes, only: %i[create update destroy activate]

  # POST /v1/projects/:project_slug/snapshots
  def create
    attrs = snapshot_attributes
    attrs[:name] = attrs[:name].presence || Snapshot.copy_name(@project, @project.active_snapshot.name)
    attrs[:bpm] ||= @project.active_snapshot.bpm
    snapshot = @project.snapshots.create!(attrs)
    render json: SnapshotSerializer.new(snapshot), status: :ok
  rescue ActiveRecord::RecordInvalid => e
    render_unprocessable_entity(e.record.errors)
  end

  def update
    attrs = snapshot_attributes
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
    # the client may need to know which snapshot became active (when the active one was deleted)
    render json: { meta: { active_snapshot_id: @project.reload.active_snapshot_id.to_s } }, status: :ok
  rescue ActiveRecord::RecordNotDestroyed
    @snapshot.errors.add(:base, 'A project needs at least one snapshot')
    render_unprocessable_entity(@snapshot.errors)
  end

  # POST /v1/snapshots/:id/activate
  def activate
    @project.update!(active_snapshot: @snapshot)
    render json: SnapshotSerializer.new(@snapshot), status: :ok
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

  # `data` is the client's capture of the tracks' settings. It arrives as a JSON *string*: request
  # parameters have their keys snake_cased (SnakeCaseParameters), which would rename the client's keys.
  def snapshot_attributes
    attrs = @attributes.permit(:name, :bpm).to_h.symbolize_keys
    attrs[:data] = JSON.parse(@attributes[:data]) if @attributes[:data].is_a?(String)
    attrs[:data] = nil if @attributes.key?(:data) && !attrs.key?(:data) # not a string: rejected by validation
    attrs
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
