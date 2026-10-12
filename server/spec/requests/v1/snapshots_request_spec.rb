require 'rails_helper'

# Snapshots: saved tempo + track settings of a project. The tracks are shared, so a snapshot is only data.
RSpec.describe 'V1 snapshots', type: :request do
  before(:each) { login_user }

  let(:project) { Project.create_with_relations!(creator_id: @current_user.id) }
  let(:main)    { project.active_snapshot }

  def api(method, path, body = nil)
    send(method, "/v1/#{path}", params: body&.to_json, headers: @headers)
    response.body.present? ? json_parse(response.body) : nil
  end

  def snapshot_payload(attributes = {})
    { data: { type: 'snapshot', attributes: attributes, relationships: { project: { data: { type: 'project', id: project.slug } } } } }
  end

  def make_snapshot(name)
    project.snapshots.create!(name: name, bpm: main.bpm)
  end

  describe 'a new project' do
    it 'starts with one active snapshot called Main, and one set of tracks' do
      expect(project.snapshots.pluck(:name)).to eq(['Main'])
      expect(main.data).to eq({})
      expect(project.tracks.count).to eq(2) # the first track and the main output
    end

    it 'has the active snapshot tempo as its bpm, and changing the bpm changes that snapshot' do
      expect(project.bpm).to eq(120)

      api(:patch, "projects/#{project.id}", { data: { id: project.id.to_s, type: 'projects', attributes: { bpm: 90 }, relationships: { creator: { data: { type: 'user', id: @current_user.id } } } } })
      expect(response).to have_http_status(200)
      expect(main.reload.bpm).to eq(90)
      expect(project.reload.bpm).to eq(90)
    end
  end

  describe 'saving a snapshot' do
    let(:captured) do
      { 'tracks' => { '7' => { 'controls' => { 'sine:0:frequency' => { 'controlValue' => 220.5, 'controlArrayValue' => [1, 2] } },
                               'sequences' => [{ 'order' => 0, 'hits' => 3, 'steps' => 16, 'offset' => 1, 'customSequence' => nil }],
                               'onstep' => { 'safeCode' => 'this.controls' } } } }
    end

    it 'stores the captured track settings exactly as sent' do
      body = api(:post, "projects/#{project.slug}/snapshots", snapshot_payload({ name: 'Verse', bpm: 100, data: captured.to_json }))

      expect(response).to have_http_status(200)
      copy = Snapshot.find(body.dig(:data, :id))
      expect(copy.slice(:name, :bpm, :position)).to eq({ 'name' => 'Verse', 'bpm' => 100, 'position' => 1 })
      expect(copy.data).to eq(captured)
      expect(JSON.parse(response.body).dig('data', 'attributes', 'data')).to eq(captured)
    end

    it 'does not create or copy any tracks or pool entries' do
      project # create it first
      expect { api(:post, "projects/#{project.slug}/snapshots", snapshot_payload) }
        .not_to(change { [Track.count, ProjectSample.count] })
    end

    it 'defaults the name and tempo from the active snapshot, and names copies uniquely' do
      main.update!(bpm: 100)
      api(:post, "projects/#{project.slug}/snapshots", snapshot_payload)
      api(:post, "projects/#{project.slug}/snapshots", snapshot_payload)

      expect(project.snapshots.pluck(:name, :bpm, :position)).to eq([['Main', 100, 0], ['Main copy', 100, 1], ['Main copy 2', 100, 2]])
    end

    it 'rejects data that is not an object' do
      api(:post, "projects/#{project.slug}/snapshots", snapshot_payload({ data: [1, 2] }))
      expect(response).to have_http_status(422)
    end
  end

  it 'a project with snapshots can be destroyed' do
    make_snapshot('B')
    project # create before counting
    expect { project.destroy! }.to change { [Project.count, Snapshot.count] }.from([1, 2]).to([0, 0])
  end

  describe 'switching' do
    it 'activate makes a snapshot the active one' do
      other = make_snapshot('B')
      api(:post, "snapshots/#{other.id}/activate")

      expect(response).to have_http_status(200)
      expect(project.reload.active_snapshot).to eq(other)
    end

    it 'tracks are shared: a new track exists whichever snapshot is active' do
      project.update!(active_snapshot: make_snapshot('B'))

      post "/v1/projects/#{project.slug}/tracks",
           params: { data: { type: 'track', attributes: { 'track-type' => 'polysynth' }, relationships: { project: { data: { type: 'project', id: project.slug } } } } }.to_json,
           headers: @headers

      expect(project.tracks.count).to eq(3)
      expect(project.ordered_tracks.last.track_type).to eq('polysynth')
    end
  end

  describe 'managing snapshots' do
    it 'renames a snapshot, sets its tempo and updates its data' do
      api(:patch, "snapshots/#{main.id}", { data: { type: 'snapshot', id: main.id.to_s, attributes: { name: 'Intro', bpm: 140, data: { tracks: { '1' => { onstep: { safeCode: 'x' } } } }.to_json } } })

      expect(response).to have_http_status(200)
      expect(main.reload.slice(:name, :bpm).values).to eq(['Intro', 140])
      expect(main.data.dig('tracks', '1', 'onstep', 'safeCode')).to eq('x')
    end

    it 'leaves data alone when only the name changes' do
      main.update!(data: { 'tracks' => {} , 'keep' => 1 })
      api(:patch, "snapshots/#{main.id}", { data: { type: 'snapshot', id: main.id.to_s, attributes: { name: 'Intro' } } })
      expect(main.reload.data['keep']).to eq(1)
    end

    it 'rejects an invalid tempo' do
      api(:patch, "snapshots/#{main.id}", { data: { type: 'snapshot', id: main.id.to_s, attributes: { bpm: 0 } } })
      expect(response).to have_http_status(422)
    end

    it 'reorders snapshots' do
      make_snapshot('B')
      c = make_snapshot('C')
      api(:patch, "snapshots/#{c.id}", { data: { type: 'snapshot', id: c.id.to_s, attributes: { position: 0 } } })

      expect(project.snapshots.reload.pluck(:name)).to eq(%w[C Main B])
      expect(project.snapshots.pluck(:position)).to eq([0, 1, 2])
    end

    it 'deletes a snapshot; the project always keeps one, and never touches the tracks' do
      b = make_snapshot('B')
      expect { api(:delete, "snapshots/#{b.id}") }.not_to(change { Track.count })
      expect(response).to have_http_status(200)
      expect(Snapshot.exists?(b.id)).to be(false)

      api(:delete, "snapshots/#{main.id}")
      expect(response).to have_http_status(422)
      expect(project.snapshots.count).to eq(1)
    end

    it 'deleting the active snapshot activates a neighbour' do
      b = make_snapshot('B')
      project.update!(active_snapshot: b)
      body = api(:delete, "snapshots/#{b.id}")

      expect(project.reload.active_snapshot).to eq(main)
      expect(body.dig(:meta, :active_snapshot_id)).to eq(main.id.to_s)
    end

    it "does not let another user change someone else's project" do
      stranger = Project.create_with_relations!(creator_id: create(:user).id)
      api(:post, "snapshots/#{stranger.active_snapshot.id}/activate")
      expect(response).to have_http_status(403)
    end
  end
end
