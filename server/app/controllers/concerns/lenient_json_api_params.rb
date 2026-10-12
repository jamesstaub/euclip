# The base controller insists every create/update body has both `attributes` and `relationships`.
# Snapshot and sample edits don't need a relationships block (renaming one shouldn't have to send one),
# so these controllers accept bodies without it.
module LenientJsonApiParams
  def set_params
    @data = params.require(:data)
    @type = @data[:type]
    @attributes = @data[:attributes] || ActionController::Parameters.new
    @relationships = @data[:relationships] || ActionController::Parameters.new
  end
end
