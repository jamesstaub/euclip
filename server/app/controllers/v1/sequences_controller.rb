class V1::SequencesController < V1::BaseController
  before_action :set_models, only: %i[show update]
  before_action :authorize_writes, only: %i[create update destroy]

  def create
    @sequence = Sequence.new(clean_params)
    if @sequence.save
      render json: SequenceSerializer.new(
        @sequence
      ), status: :ok
    else
      render_unprocessable_entity(@sequence.errors)
    end
  end

  def update
    # TODO: if updating euclidean hit while there is a custom sequence, revert to euclidean mode (clear seq)
    # TODO: implement rotation of custom_seq
    @sequence.update(cleaned_params)
    if @sequence.save
      render json: SequenceSerializer.new(
        @sequence,
      ), status: :ok
    else
      render_unprocessable_entity(@sequence.errors)
    end
  end

  private

  def set_models
    sequence = Sequence.includes(:track => :project).find(params[:id])
    raise ActiveRecord::RecordNotFound unless sequence.present?
    # bare minimum permissions check before setting @sequence attribute
    return render_forbidden unless can? :view, sequence.track.project
    @sequence = sequence
    @project = sequence.track.project
  end

  def authorize_writes
    return render_forbidden unless can? :update, @project
  end

  def cleaned_params
    @attributes.permit(:hits, :steps, :offset, :custom_sequence => [])
  end
end
