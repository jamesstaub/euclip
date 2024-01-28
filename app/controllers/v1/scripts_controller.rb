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
    script = Script.includes({:track => :project})
                    .find(params[:id])

    raise ActiveRecord::RecordNotFound unless script.present?
    return render_unauthorized unless can? :update, script.track.project
    @script = script
  end

  # The client sends the 'code' attribute which represents the currently saved 
  # state of the text editor
  # 'safe_code' is saved in the database after the 'code' string is sanitized
  def set_clean_attrs
    # TODO implement the javascript code cleaning solution implemented in a google 
    # function script to strip out potentially malicious code
    attrs = @attributes.permit(:code, :editor_content).to_h
    attrs[:safe_code] = attrs[:code] if attrs[:code].present?
    @clean_attrs = attrs.except(:code)
  end

  def serializer_klass
    if @type == "init-scripts"
      InitScriptSerializer
    elsif @type == "onstep-scripts"
      OnstepScriptSerializer
    end
  end  
end
