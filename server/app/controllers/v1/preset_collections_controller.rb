class V1::PresetCollectionsController < V1::BaseController
  before_action :set_global_preset_creator, only: %i[index]
  
  def index
    @pagy, @preset_collections = pagy(PresetCollection.where(creator_id: @creator.id))
    render json: PresetCollectionSerializer.new(
      @preset_collections,
      include: included_relations,
      meta: { pagination: pagy_metadata(@pagy) }
    ), status: :ok
  end


  private

  # when calling index from /presets (not nested in user id route)
  # we fetch the default app presets, whcih are saved under the 
  # euclip user
  def set_global_preset_creator
    unless @creator
      @creator = User.ADMIN_PUBLISHER
    end
  end
end
