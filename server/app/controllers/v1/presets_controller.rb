class V1::PresetsController < V1::BaseController

  # TODO
  # add actions to "save to my collection"
  # in the UI when saving a script to collection, give the option to update
  # the script that was already loaded, or to save as new 

  # For full CRUD of user presets, PresetCollections should get it's own controller
  def show
    @preset = Preset.find(params[:id])
    render json: PresetSerializer.new(
      @preset,
      include: included_relations,
      params: { with_relations: true}
    ), status: :ok
  end

end
