require 'rails_helper'

RSpec.describe 'V1 track types', type: :request do
  before(:each) { login_user }

  let(:project) { Project.create_with_relations!(creator_id: @current_user.id) }

  def create_track(track_type = nil)
    attributes = track_type ? { 'track-type' => track_type } : { 'hits' => 1 }
    post "/v1/projects/#{project.slug}/tracks?include=sequences,init-script,onstep-script",
         params: { data: { type: 'track', attributes: attributes,
                           relationships: { project: { data: { type: 'project', id: project.slug } } } } }.to_json,
         headers: @headers
    json_parse(response.body)
  end

  it 'lists the available types, each with a title and description' do
    get '/v1/track-types', headers: @headers
    types = json_parse(response.body)[:data]

    expect(response).to have_http_status(200)
    expect(types.map { |t| t[:id] }).to eq(%w[sampler looped_sampler multi_sampler sliced_sample chopped_loop evolving_rhythm humanized_sampler filter_sweep oscillator_arp polysynth])
    expect(types).to all(satisfy { |t| t[:attributes][:title].present? && t[:attributes][:description].present? })
  end

  it "writes every preset's play script with cracked's helpers (__.random, __.chance, __.scales...), not Math.random" do
    TrackType.all.each do |type|
      expect(type.onstep_script).not_to include('Math.random'), "#{type.key} uses Math.random"
    end
    expect(TrackType.find('chopped_loop').onstep_script).to include('__.shuffle', '__.fill_array', '__.chance', '__.random')
    expect(TrackType.find('humanized_sampler').onstep_script).to include('__.random', '__.chance')
    expect(TrackType.find('oscillator_arp').onstep_script).to include("__.scales('minor')", '__.chance')
    expect(TrackType.find('polysynth').onstep_script).to include("__.scales('minor')")
  end

  it 'never hard-codes node ids: an id is a selector for the whole page, so a duplicated track would clash' do
    TrackType.all.each do |type|
      # ({ id: 'x' } in a node's options, or a '#x' selector; the project's shared main output is the one global)
      scripts = [type.init_script, type.onstep_script].map { |code| code.gsub('#main-output', '') }
      scripts.each do |code|
        expect(code).not_to match(/\bid:\s*['"]/), "#{type.key} gives a node an id"
        expect(code).not_to match(/['"]#[a-z]/i), "#{type.key} selects by an id"
      end
    end
    expect(TrackType.find('multi_sampler').init_script).to include("this.selector('gain')")
  end

  it 'says looped samplers should use Loop Sync speed' do
    get '/v1/track-types', headers: @headers
    looped = json_parse(response.body)[:data].find { |t| t[:id] == 'looped_sampler' }
    expect(looped.dig(:attributes, :controls)).to eq('sampler.speed': { unit: 'Loop Sync' })
  end

  it 'requires sign in' do
    cookies.delete('_euclip_session') # test the JWT requirement, not the leftover session cookie
    get '/v1/track-types', headers: { Accept: APP_JSON }
    expect(response).to have_http_status(401)
  end

  describe 'creating a track of a type' do
    it 'defaults to a plain sampler' do
      body = create_track
      expect(response).to have_http_status(200)
      track = Track.find(body.dig(:data, :id))

      expect(track.track_type).to eq('sampler')
      expect(track.init_script.safe_code).to include('.sampler(').and include('this.files[0]')
      expect(track.sequences.count).to eq(1)
    end

    it 'copies a looped sampler: looping sampler script and a one-hit sequence' do
      track = Track.find(create_track('looped_sampler').dig(:data, :id))

      expect(track.track_type).to eq('looped_sampler')
      expect(track.init_script.safe_code).to include('loop: true')
      expect(track.sequences.pluck(:hits, :steps)).to eq([[1, 8]])
    end

    it 'copies a multi-sample kit: four samplers' do
      track = Track.find(create_track('multi_sampler').dig(:data, :id))

      expect(track.init_script.safe_code.scan(/this\.files\[i\]/).size).to eq(1) # one loop over four slots
      expect(track.init_script.safe_code).to include('[0, 1, 2, 3]')
      expect(track.onstep_script.safe_code).to include('playSourceNode(data - 1)') # a step's value is the sampler, 1-based
      expect(track.sequences.first).to have_attributes(max_value: 4, custom_sequence: [1, 0, 2, 0, 3, 0, 4, 0])
    end

    it 'copies an evolving rhythm: a play script that rewrites its sequence on the last step of each loop' do
      track = Track.find(create_track('evolving_rhythm').dig(:data, :id))

      expect(track.onstep_script.safe_code).to include('this.sequences[0]', 'sequence.euclidean(', 'sequence.set(this.euclidean(')
    end

    it 'copies the scripts that show off this.controls (read a slider, offset it for one step)' do
      %w[humanized_sampler filter_sweep oscillator_arp].each do |key|
        track = Track.find(create_track(key).dig(:data, :id))
        expect(track.track_type).to eq(key)
        expect(track.onstep_script.safe_code).to match(/this\.controls\.\w+\.\w+/)
      end
    end

    it 'seeds the starting values the play scripts read, addressing nodes by type' do
      humanized = Track.find(create_track('humanized_sampler').dig(:data, :id))
      expect(humanized.init_script.safe_code).to include('frequency: 8000', 'gain: 0.8')
      expect(humanized.onstep_script.safe_code).to include('this.controls.lowpass.frequency', 'this.controls.gain.gain')

      arp = Track.find(create_track('oscillator_arp').dig(:data, :id))
      expect(arp.init_script.safe_code).to include('frequency: 220')
      expect(arp.onstep_script.safe_code).to include('this.controls.sine.frequency')
    end

    it 'copies a polysynth built on the cracked polysynth macro' do
      track = Track.find(create_track('polysynth').dig(:data, :id))

      expect(track.init_script.safe_code).to include('.polysynth(')
      expect(track.onstep_script.safe_code).to include("polysynth('noteOn'")
    end

    it 'falls back to a sampler for an unknown type' do
      track = Track.find(create_track('does_not_exist').dig(:data, :id))
      expect(track.track_type).to eq('sampler')
    end

    it 'leaves the project master track (main output) alone' do
      master = project.tracks.find_by(is_master: true)

      expect(master.track_type).to eq('master')
      expect(master.init_script.safe_code).to include("id: 'main-output'")
    end
  end
end
