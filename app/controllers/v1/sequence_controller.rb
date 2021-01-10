class V1::SequenceController < V1::BaseController
  
  private

  def cleaned_params
    @attributes.permit(:hits, :steps, :offset, :custom_sequence => [])
  end
end
