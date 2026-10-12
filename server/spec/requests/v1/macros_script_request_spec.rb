require 'rails_helper'

# The project-wide script where macros are registered; it belongs to a project, not a track.
RSpec.describe 'V1 macros script', type: :request do
  before(:each) { login_user }

  let(:project) { Project.create_with_relations!(creator_id: @current_user.id) }
  let(:macros_script) { project.macros_script }

  def save_macros_script(script, attributes)
    patch "/v1/macros-scripts/#{script.id}",
          params: { data: { type: 'macros-scripts', id: script.id.to_s, attributes: attributes,
                            relationships: { project: { data: { type: 'projects', id: project.id.to_s } } } } }.to_json,
          headers: @headers
  end

  it 'is created with every project, with a starting script that explains itself' do
    expect(macros_script).to be_a(MacrosScript)
    expect(macros_script.project).to eq(project)
    expect(macros_script.track).to be_nil
    expect(macros_script.safe_code).to include('declareControls')
    expect(macros_script.editor_content).to eq(macros_script.safe_code)
  end

  it 'is one per project' do
    expect(Script.where(type: 'MacrosScript', project_id: project.id).count).to eq(1)
  end

  it 'is deleted with its project' do
    expect(Project.reflect_on_association(:macros_script).options[:dependent]).to eq(:destroy)
  end

  it 'saves the editor draft without touching the running script' do
    original = macros_script.safe_code
    save_macros_script(macros_script, { 'editor_content' => "// draft" })

    expect(response).to have_http_status(200)
    expect(macros_script.reload.editor_content).to eq('// draft')
    expect(macros_script.safe_code).to eq(original)
  end

  it 'runs what was loaded: code becomes safe_code' do
    save_macros_script(macros_script, { 'code' => "this.declareControls('polysynth', {});", 'editor_content' => "this.declareControls('polysynth', {});" })

    expect(response).to have_http_status(200)
    expect(macros_script.reload.safe_code).to eq("this.declareControls('polysynth', {});")
    expect(json_parse(response.body).dig(:data, :type)).to eq('macros-script')
  end

  it "is not editable by someone who isn't on the project" do
    other = User.create!(username: 'stranger', email: 'stranger@example.com', password: 'Passw0rd!x', password_confirmation: 'Passw0rd!x', first_name: 'a', last_name: 'b')
    foreign = Project.create_with_relations!(creator_id: other.id).macros_script

    patch "/v1/macros-scripts/#{foreign.id}",
          params: { data: { type: 'macros-scripts', id: foreign.id.to_s, attributes: { 'editor_content' => 'x' },
                            relationships: { project: { data: { type: 'projects', id: foreign.project_id.to_s } } } } }.to_json,
          headers: @headers
    expect(response).to have_http_status(403)
    expect(foreign.reload.editor_content).not_to eq('x')
  end

  it "comes with the project's JSON, so the client has it on load" do
    get "/v1/users/#{@current_user.id}/projects/#{project.slug}?creator_id=#{@current_user.id}&include=macros-script", headers: @headers
    body = json_parse(response.body)
    expect(response).to have_http_status(200)
    expect(body.dig(:data, :relationships, :'macros-script', :data, :id)).to eq(macros_script.id.to_s)
    expect(body[:included].map { |i| i[:type] }).to include('macros-script')
  end
end
