require 'rails_helper'

# Snapshots: complete, switchable states of a project (tracks + tempo). Edits apply to the active one.
RSpec.describe 'V1 snapshots', type: :request do
  before(:each) { login_user }

  let(:project) { Project.create_with_relations!(creator_id: @current_user.id) }
  let(:main)    { project.active_snapshot }

  def api(method, path, body = nil)
    send(method, "/v1/#{path}", params: body&.to_json, headers: @headers)
    response.body.present? ? json_parse(response.body) : nil
  end

  def snapshot_payload(attributes = {}, source: nil)
    relationships = { project: { data: { type: 'project', id: project.slug } } }
    relationships[:source] = { data: { type: 'snapshot', id: source.id.to_s } } if source
    { data: { type: 'snapshot', attributes: attributes, relationships: relationships } }
  end

  describe 'a new project' do
    it 'starts with one active snapshot called Main holding its tracks' do
      expect(project.snapshots.pluck(:name)).to eq(['Main'])
      expect(main.tracks.count).to eq(2) # the first track and the main output
      expect(main.master_track).to be_present
      expect(project.active_tracks).to match_array(main.tracks)
    end

    it 'has the active snapshot tempo as its bpm, and changing the bpm changes that snapshot' do
      expect(project.bpm).to eq(120)

      api(:patch, "projects/#{project.id}", { data: { id: project.id.to_s, type: 'projects', attributes: { bpm: 90 }, relationships: { creator: { data: { type: 'user', id: @current_user.id } } } } })
      expect(response).to have_http_status(200)
      expect(main.reload.bpm).to eq(90)
      expect(project.reload.bpm).to eq(90)
    end
  end

  describe 'saving a snapshot (clone)' do
    let(:track) { main.ordered_tracks.first }

    before do
      track.init_script.update!(safe_code: '__().sine().dac()', editor_content: '__().sine().dac()')
      track.sequences.first.update!(hits: 3, steps: 16)
      track.track_controls.create!(node_type: 'sine', node_attr: 'frequency', node_order: 0, interface_name: 'slider', control_value: 220)
      track.filepath_controls.create!(control_value: '/Roland/kick.mp3', node_order: 0)
    end

    it 'copies every track with its scripts, sequences, controls and sample slots' do
      body = api(:post, "projects/#{project.slug}/snapshots", snapshot_payload({ name: 'Verse' }))

      expect(response).to have_http_status(200)
      copy = Snapshot.find(body.dig(:data, :id))
      expect(copy.name).to eq('Verse')
      expect(copy.position).to eq(1)
      expect(copy.tracks.count).to eq(main.tracks.count)
      expect(copy.master_track).to be_present

      copied = copy.ordered_tracks.first
      expect(copied.id).not_to eq(track.id)
      expect(copied.init_script.safe_code).to eq('__().sine().dac()')
      expect(copied.sequences.first.slice(:hits, :steps)).to eq(track.sequences.first.slice(:hits, :steps))
      expect(copied.track_controls.pluck(:node_attr)).to include('frequency')
      expect(copied.filepath_controls.first.control_value).to eq('/Roland/kick.mp3')
    end

    it 'shares the sample pool: no pool entries are copied' do
      expect { api(:post, "projects/#{project.slug}/snapshots", snapshot_payload) }.not_to change { ProjectSample.count }

      copy = project.snapshots.last
      expect(copy.ordered_tracks.first.filepath_controls.first.project_sample_id)
        .to eq(track.filepath_controls.first.project_sample_id)
    end

    it 'is independent of its source: editing the copy leaves the original alone' do
      api(:post, "projects/#{project.slug}/snapshots", snapshot_payload)
      copy_track = project.snapshots.last.ordered_tracks.first
      copy_track.init_script.update!(safe_code: '// changed')
      copy_track.sequences.first.update!(steps: 4)

      expect(track.init_script.reload.safe_code).to eq('__().sine().dac()')
      expect(track.sequences.first.reload.steps).to eq(16)
    end

    it 'keeps the tempo and names copies uniquely' do
      main.update!(bpm: 100)
      api(:post, "projects/#{project.slug}/snapshots", snapshot_payload)
      api(:post, "projects/#{project.slug}/snapshots", snapshot_payload)

      expect(project.snapshots.pluck(:name, :bpm, :position)).to eq([['Main', 100, 0], ['Main copy', 100, 1], ['Main copy 2', 100, 2]])
    end

    it 'can clone any snapshot, not just the active one' do
      other = main.clone!(name: 'Other')
      other.ordered_tracks.first.init_script.update!(safe_code: '// other')
      api(:post, "projects/#{project.slug}/snapshots", snapshot_payload({ name: 'From other' }, source: other))

      copy = project.snapshots.find_by(name: 'From other')
      expect(copy.ordered_tracks.first.init_script.safe_code).to eq('// other')
    end
  end

  describe 'switching' do
    it 'activate makes a snapshot the active one and the project shows its tracks' do
      other = main.clone!(name: 'B')
      api(:post, "snapshots/#{other.id}/activate")

      expect(response).to have_http_status(200)
      expect(project.reload.active_snapshot).to eq(other)
      track_ids = json_parse(response.body).dig(:data, :relationships, :tracks, :data).map { |t| t[:id].to_i }
      expect(track_ids).to match_array(other.tracks.pluck(:id))
    end

    it 'new tracks go into the active snapshot only' do
      other = main.clone!(name: 'B')
      project.update!(active_snapshot: other)
      before_main = main.tracks.count

      post "/v1/projects/#{project.slug}/tracks",
           params: { data: { type: 'track', attributes: { 'track-type' => 'polysynth' }, relationships: { project: { data: { type: 'project', id: project.slug } } } } }.to_json,
           headers: @headers

      expect(main.tracks.count).to eq(before_main)
      expect(other.tracks.count).to eq(before_main + 1)
      expect(other.ordered_tracks.last.track_type).to eq('polysynth')
    end

    it 'deleting a track only renumbers the tracks of its own snapshot' do
      other = main.clone!(name: 'B')
      first, second = main.ordered_tracks.first, nil
      Track.create_with_relations!({ project_id: project.id, snapshot: main })
      second = main.ordered_tracks.last

      delete "/v1/tracks/#{first.id}", headers: @headers

      expect(main.ordered_tracks.pluck(:order)).to eq([1])
      expect(other.ordered_tracks.pluck(:order)).to eq([1])
      expect(second.reload.order).to eq(1)
    end
  end

  describe 'managing snapshots' do
    it 'renames a snapshot and sets its tempo' do
      api(:patch, "snapshots/#{main.id}", { data: { type: 'snapshot', id: main.id.to_s, attributes: { name: 'Intro', bpm: 140 } } })

      expect(response).to have_http_status(200)
      expect(main.reload.slice(:name, :bpm).values).to eq(['Intro', 140])
    end

    it 'rejects an invalid tempo' do
      api(:patch, "snapshots/#{main.id}", { data: { type: 'snapshot', id: main.id.to_s, attributes: { bpm: 0 } } })
      expect(response).to have_http_status(422)
    end

    it 'reorders snapshots' do
      b = main.clone!(name: 'B')
      c = main.clone!(name: 'C')
      api(:patch, "snapshots/#{c.id}", { data: { type: 'snapshot', id: c.id.to_s, attributes: { position: 0 } } })

      expect(project.snapshots.reload.pluck(:name)).to eq(%w[C Main B])
      expect(project.snapshots.pluck(:position)).to eq([0, 1, 2])
    end

    it 'deletes a snapshot with its tracks; the project always keeps one' do
      b = main.clone!(name: 'B')
      track_ids = b.tracks.pluck(:id)
      api(:delete, "snapshots/#{b.id}")
      expect(response).to have_http_status(200)
      expect(Snapshot.exists?(b.id)).to be(false)
      expect(Track.where(id: track_ids)).to be_empty

      api(:delete, "snapshots/#{main.id}")
      expect(response).to have_http_status(422)
      expect(project.snapshots.count).to eq(1)
    end

    it 'deleting the active snapshot activates a neighbour' do
      b = main.clone!(name: 'B')
      project.update!(active_snapshot: b)
      api(:delete, "snapshots/#{b.id}")

      expect(project.reload.active_snapshot).to eq(main)
    end

    it "does not let another user change someone else's project" do
      stranger = Project.create_with_relations!(creator_id: create(:user).id)
      api(:post, "snapshots/#{stranger.active_snapshot.id}/activate")
      expect(response).to have_http_status(403)
    end
  end
end
