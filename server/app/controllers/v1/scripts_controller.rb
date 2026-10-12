class V1::ScriptsController < V1::BaseController
  before_action :set_script, only: %i[show update]
  before_action :set_clean_attrs, only: %i[update]
  before_action :serializer_klass, only: %i[update]

  def update
    @script.update(@clean_attrs)
    if @script.save
      render json: serializer_klass.new(
        @script,
        include: included_relations
      ), status: :ok
    else
      render_unprocessable_entity(@script.errors)
    end
  end

  private
  
  def set_script
    script = Script.includes({:track => :project}, :project)
                    .find(params[:id])

    raise ActiveRecord::RecordNotFound unless script.present?
    # a track's script belongs to the track's project; a MacrosScript to its project directly
    project = script.track&.project || script.project
    return render_forbidden unless project && can?(:update, project)
    @script = script
  end

  # `code` is the script the user last *loaded* (ran). It is the only thing that changes the running
  # script: 'safe_code' is saved from it after sanitizing. `editor_content` is just the editor's draft.
  def set_clean_attrs
    # TODO implement the javascript code cleaning solution implemented in a google 
    # function script to strip out potentially malicious code
    attrs = @attributes.permit(:code, :editor_content).to_h
    @clean_attrs = attrs.except(:code)

    # Saving a draft sends `code` as null/absent. That must leave safe_code alone: assigning nil here
    # used to make the model fall back to the default sampler script, silently replacing the running
    # script just because the editor was opened. (An empty string disables the script.)
    @clean_attrs[:safe_code] = attrs[:code] unless attrs[:code].nil?
  end

  def serializer_klass
    if @type == "init-scripts"
      InitScriptSerializer
    elsif @type == "onstep-scripts"
      OnstepScriptSerializer
    elsif @type == "macros-scripts"
      MacrosScriptSerializer
    end
  end  
end
