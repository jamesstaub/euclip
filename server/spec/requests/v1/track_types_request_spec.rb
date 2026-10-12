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
    expect(types.map { |t| t[:id] }).to eq(%w[sampler looped_sampler multi_sampler humanized_sampler filter_sweep oscillator_arp polysynth])
    expect(types).to all(satisfy { |t| t[:attributes][:title].present? && t[:attributes][:description].present? })
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

    it 'copies a multi-sample kit: four sampler pads' do
      track = Track.find(create_track('multi_sampler').dig(:data, :id))

      expect(track.init_script.safe_code.scan(/this\.files\[i\]/).size).to eq(1) # one loop over four slots
      expect(track.init_script.safe_code).to include('[0, 1, 2, 3]')
      expect(track.onstep_script.safe_code).to include('playSourceNode')
    end

    it 'copies the scripts that show off this.controls (read a slider, offset it for one step)' do
      %w[humanized_sampler filter_sweep oscillator_arp].each do |key|
        track = Track.find(create_track(key).dig(:data, :id))
        expect(track.track_type).to eq(key)
        expect(track.onstep_script.safe_code).to match(/this\.controls\.\w+\.\w+/)
      end
    end

    it 'seeds the ids and starting values that the play scripts address' do
      humanized = Track.find(create_track('humanized_sampler').dig(:data, :id))
      expect(humanized.init_script.safe_code).to include("id: 'filter'", "id: 'level'")
      expect(humanized.onstep_script.safe_code).to include('this.controls.filter.frequency', 'this.controls.level.gain')

      arp = Track.find(create_track('oscillator_arp').dig(:data, :id))
      expect(arp.init_script.safe_code).to include("id: 'lead'", 'frequency: 220')
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
