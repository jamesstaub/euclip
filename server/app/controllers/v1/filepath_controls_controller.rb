class V1::FilepathControlsController < V1::BaseController
  before_action :set_models, only: %i[show update destroy]
  before_action :set_relations, only: %i[create]
  before_action :authorize_writes, only: %i[create update destroy]

  def show
    render json: FilepathControlSerializer.new(@filepath_control), status: :ok
  end
  
  def create
    @filepath_control = FilepathControl.new(clean_params)
    if @filepath_control.save
      render json: FilepathControlSerializer.new(
        @filepath_control,
        include: included_relations
      ), status: :ok

    else
      render_unprocessable_entity(@filepath_control.errors)
    end
  end

  def update
    @filepath_control.update(clean_params)
    if @filepath_control.save
      render json: FilepathControlSerializer.new(
        @filepath_control,
        include: included_relations
      ), status: :ok
    else
      render_unprocessable_entity(@filepath_control.errors)
    end
  end

  def destroy
    @filepath_control.destroy
    render json: { meta: {} }, status: :ok
  end
  
  private

  def set_models
    filepath_control = FilepathControl.includes(:track => :project).find(params[:id])

    raise ActiveRecord::RecordNotFound unless filepath_control.present? && 
                                                filepath_control.track.present? && 
                                                filepath_control.track.project.present?

    # bare minimum permissions check before setting track attribute
    return render_forbidden unless can? :view, filepath_control.track.project
    @filepath_control = filepath_control
    @track = filepath_control.track
    @project = filepath_control.track.project
  end
  
  def set_relations
    track = Track.includes(:project).find(@relationships[:track][:data][:id])
    raise ActiveRecord::RecordNotFound unless track.present?
    return render_forbidden unless can? :view, track.project
    @track = track
    @project = track.project
  end

  def authorize_writes
    return render_forbidden unless can? :update, @project
  end

  def clean_params
    # REFACTOR
    # should a filepath control ever have it's node attribute, node type or node order changed?
    # they may be create-only params
    attrs = @attributes.permit(
                               :control_value, 
                               :node_order,
                               :project_sample_id, # a pick from the project's sample pool (the pool decides the path)
                              )

    
    attrs.merge(track_id: @track.id).to_h.reject{|_, v| v.nil?}
  end
end
