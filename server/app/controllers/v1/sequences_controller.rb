class V1::SequencesController < V1::BaseController
  before_action :set_models, only: %i[show update destroy]
  before_action :set_relations, only: %i[create]
  before_action :authorize_writes, only: %i[create update destroy]

  # adds another sequence to a track (it goes after the existing ones unless `order` is given)
  def create
    @sequence = Sequence.new(cleaned_params.to_h.merge(track_id: @track.id))
    if @sequence.save
      render json: SequenceSerializer.new(@sequence), status: :ok
    else
      render_unprocessable_entity(@sequence.errors)
    end
  end

  def update
    # TODO: if updating euclidean hit while there is a custom sequence, revert to euclidean mode (clear seq)
    # TODO: implement rotation of custom_seq
    if @sequence.update(cleaned_params)
      render json: SequenceSerializer.new(@sequence), status: :ok
    else
      render_unprocessable_entity(@sequence.errors)
    end
  end

  def destroy
    # every track keeps at least its primary sequence
    if @track.sequences.count <= 1
      @sequence.errors.add(:base, 'A track needs at least one sequence')
      return render_unprocessable_entity(@sequence.errors)
    end

    @sequence.destroy
    render json: { meta: {} }, status: :ok
  end

  private

  def set_models
    sequence = Sequence.includes(:track => :project).find(params[:id])
    raise ActiveRecord::RecordNotFound unless sequence.present?
    # bare minimum permissions check before setting @sequence attribute
    return render_forbidden unless can? :view, sequence.track.project
    @sequence = sequence
    @track = sequence.track
    @project = sequence.track.project
  end

  def set_relations
    track = Track.includes(:project).find(@relationships[:track][:data][:id])
    return render_forbidden unless can? :view, track.project
    @track = track
    @project = track.project
  end

  def authorize_writes
    return render_forbidden unless can? :update, @project
  end

  def cleaned_params
    @attributes.permit(:hits, :steps, :offset, :order, :custom_sequence => [])
  end
end
