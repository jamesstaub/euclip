require 'rails_helper'

# Sequences, track controls and filepath controls: the per-track data a track's audio is built from.
RSpec.describe 'V1 track resources', type: :request do
  before(:each) { login_user }

  let(:project) { Project.create_with_relations!(creator_id: @current_user.id) }
  let(:track)   { project.tracks.find_by(is_master: [false, nil]) }

  def payload(type, attributes, track_id = track.id)
    { data: { type: type, attributes: attributes,
              relationships: { track: { data: { type: 'tracks', id: track_id.to_s } } } } }.to_json
  end

  def post_json(path, type, attributes)
    post "/v1/#{path}", params: payload(type, attributes), headers: @headers
    json_parse(response.body)
  end

  def patch_json(path, id, type, attributes)
    patch "/v1/#{path}/#{id}", params: payload(type, attributes).sub('"attributes"', %("id":"#{id}","attributes")), headers: @headers
    json_parse(response.body)
  end

  describe 'sequences' do
    it 'a new track starts with one primary sequence at order 0' do
      expect(track.sequences.pluck(:order)).to eq([0])
    end

    it 'adds more sequences after the existing ones' do
      body = post_json('sequences', 'sequences', { hits: 3, steps: 16 })
      expect(response).to have_http_status(200)
      expect(body.dig(:data, :attributes, :order)).to eq(1)

      post_json('sequences', 'sequences', { hits: 1, steps: 4 })
      expect(track.reload.sequences.pluck(:order, :steps)).to eq([[0, 8], [1, 16], [2, 4]])
    end

    it 'rejects two sequences with the same order' do
      post_json('sequences', 'sequences', { steps: 16, order: 0 })
      expect(response).to have_http_status(422)
    end

    it 'updates a sequence (euclidean parameters and custom steps)' do
      seq = track.sequences.first
      body = patch_json('sequences', seq.id, 'sequences', { hits: 5, steps: 32, custom_sequence: [1, 0, 1, 0] })
      expect(response).to have_http_status(200)
      expect(body.dig(:data, :attributes)).to include(hits: 5, steps: 32)
      expect(seq.reload.custom_sequence).to eq([1, 0, 1, 0])
    end

    it 'deletes a secondary sequence but never the last one' do
      second = Sequence.create!(track: track, steps: 4)
      delete "/v1/sequences/#{second.id}", headers: @headers
      expect(response).to have_http_status(200)
      expect(track.sequences.count).to eq(1)

      delete "/v1/sequences/#{track.sequences.first.id}", headers: @headers
      expect(response).to have_http_status(422)
      expect(track.sequences.count).to eq(1)
    end

    it "does not let another user's track be changed" do
      other_track = Project.create_with_relations!(creator_id: create(:user).id).tracks.first
      post "/v1/sequences", params: payload('sequences', { steps: 4 }, other_track.id), headers: @headers
      expect(response).to have_http_status(403)
    end
  end

  describe 'filepath controls (one file per sampler slot)' do
    it 'stores a file per slot and exposes them in order' do
      post_json('filepath-controls', 'filepath-controls', { control_value: 'Roland/kick.mp3', node_order: 0 })
      expect(response).to have_http_status(200)
      post_json('filepath-controls', 'filepath-controls', { control_value: 'Roland/snare.mp3', node_order: 1 })
      expect(response).to have_http_status(200)

      expect(track.filepath_controls.order(:node_order).pluck(:control_value)).to eq(['/Roland/kick.mp3', '/Roland/snare.mp3']) # normalized: stored with a leading slash
    end

    it 'refuses a second file for the same slot (the old race created duplicates)' do
      post_json('filepath-controls', 'filepath-controls', { control_value: 'a.mp3', node_order: 0 })
      post_json('filepath-controls', 'filepath-controls', { control_value: 'b.mp3', node_order: 0 })

      expect(response).to have_http_status(422)
      expect(track.filepath_controls.count).to eq(1)
    end

    it 'refuses an empty path' do
      post_json('filepath-controls', 'filepath-controls', { control_value: '', node_order: 0 })
      expect(response).to have_http_status(422)
    end

    it 'defaults a new track created from several files to slots 0..n-1' do
      t = Track.create_with_relations!({ project_id: project.id, file_path: 'x/y.mp3' })
      expect(t.filepath_controls.pluck(:node_order)).to eq([0])
    end
  end

  describe 'track controls' do
    let(:attrs) { { node_type: 'sampler', node_attr: 'speed', node_order: 0, interface_name: 'slider', min: 0, max: 2, default_value: 1, control_value: 1 } }

    it 'creates one control per node attribute and refuses duplicates' do
      post_json('track-controls', 'track-controls', attrs)
      expect(response).to have_http_status(200)

      post_json('track-controls', 'track-controls', attrs.merge(control_value: 0.5))
      expect(response).to have_http_status(422)
      expect(track.track_controls.where(node_attr: 'speed').count).to eq(1)
    end

    it 'allows the same attr on a different node' do
      post_json('track-controls', 'track-controls', attrs)
      post_json('track-controls', 'track-controls', attrs.merge(node_order: 1))
      expect(response).to have_http_status(200)
    end

    it 'round-trips a multislider array longer than one page (32 steps)' do
      body = post_json('track-controls', 'track-controls', attrs.merge(interface_name: 'multislider'))
      values = (0...32).map { |i| i / 10.0 }
      patch_json('track-controls', body.dig(:data, :id), 'track-controls', { control_array_value: values })
      expect(response).to have_http_status(200)

      get "/v1/track-controls/#{body.dig(:data, :id)}", headers: @headers
      stored = json_parse(response.body).dig(:data, :attributes, :'control-array-value')
      expect(stored.length).to eq(32)
      expect(stored.last).to be_within(0.001).of(3.1)
    end

    it 'defaults a control to follow the track primary sequence' do
      body = post_json('track-controls', 'track-controls', attrs)
      expect(body.dig(:data, :attributes, :'sequence-order')).to eq(0)
    end
  end
end
