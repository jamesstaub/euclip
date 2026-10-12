require 'rails_helper'

# A script has the code that is RUNNING (safe_code, set by "Load") and the editor's DRAFT (editor_content).
RSpec.describe 'Scripts', type: :request do
  before(:each) { login_user }

  let(:project) { Project.create_with_relations!(creator_id: @current_user.id) }
  let(:track)   { project.tracks.find_by(is_master: [false, nil]) }

  def save_script(script, attributes)
    kind = script.is_a?(InitScript) ? 'init-scripts' : 'onstep-scripts'
    patch "/v1/#{kind}/#{script.id}",
          params: { data: { type: kind, id: script.id.to_s, attributes: attributes,
                            relationships: { track: { data: { type: 'tracks', id: track.id.to_s } } } } }.to_json,
          headers: @headers
  end

  let(:polysynth_code) { TrackType.find('polysynth').init_script }

  before(:each) do
    # a polysynth track, as created from the New Track menu
    track.init_script.update!(safe_code: polysynth_code, editor_content: polysynth_code)
  end

  describe 'saving the editor draft' do
    it 'leaves the running script alone when only editor_content is sent' do
      save_script(track.init_script, { 'editor_content' => polysynth_code + "\n// tweak" })

      expect(response).to have_http_status(200)
      expect(track.init_script.reload.safe_code).to eq(polysynth_code)
      expect(track.init_script.editor_content).to end_with('// tweak')
    end

    it 'leaves the running script alone when code is sent as null (what the Ember client does)' do
      save_script(track.init_script, { 'code' => nil, 'editor_content' => polysynth_code })

      expect(track.init_script.reload.safe_code).to eq(polysynth_code)
      expect(track.init_script.safe_code).not_to eq(TrackType.find('sampler').init_script)
    end

    it 'does the same for the play (onstep) script' do
      onstep = track.onstep_script
      before = onstep.safe_code
      save_script(onstep, { 'code' => nil, 'editor_content' => 'if (data) { this.play(); } // draft' })

      expect(onstep.reload.safe_code).to eq(before)
    end
  end

  describe 'loading a script' do
    it 'replaces the running script with the submitted code' do
      save_script(track.init_script, { 'code' => '__().sine().dac()', 'editor_content' => '__().sine().dac()' })

      expect(track.init_script.reload.safe_code).to eq('__().sine().dac()')
    end

    it 'an empty string disables the script instead of restoring the default' do
      save_script(track.init_script, { 'code' => '', 'editor_content' => '' })

      expect(track.init_script.reload.safe_code).to eq('')
    end
  end

  it 'new tracks still get their type script when created' do
    expect(Track.create_with_relations!({ project_id: project.id, track_type: 'looped_sampler' }).init_script.safe_code)
      .to include('loop: true')
  end
end
