class V1::SequencesController < V1::BaseController
  before_action :set_sequence, only: %i[show update]
  
  def update
    @sequence.update(cleaned_params)
    if @sequence.save
      render json: SequenceSerializer.new(
        @sequence,
      ), status: :ok
    else
      render json: { errors: @sequence.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  private

  def set_sequence
    @sequence = Sequence.find(params[:id])
  end

  def cleaned_params
    @attributes.permit(:hits, :steps, :offset, :custom_sequence => [])
  end
end
