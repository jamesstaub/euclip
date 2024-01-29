class V1::BaseController < ApplicationController  
  before_action ->{ authenticate_user!(force: true) }
  before_action :check_authorization, only: %i[create update destroy]
  before_action :set_params, only: %i[create update]


  
  def check_authorization
    return render_unauthorized unless current_user
  end

  # parse the include?[model-name] query param 
  # map into format expected by serialzer for :include option
  def included_relations
    relations = params["include"]
    if relations.present?
      relations.split(',').map(&:underscore).map(&:to_sym)
    end
  end

  def set_params
    @data = params.require(:data)
    @type = @data.require(:type)
    @attributes = @data.require(:attributes)
    @relationships = @data.require(:relationships)
  end
  
end