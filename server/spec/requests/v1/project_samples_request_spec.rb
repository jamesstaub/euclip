require 'rails_helper'

# The project sample pool: samples a project uses, shared by every snapshot; tracks pick from it.
RSpec.describe 'V1 project samples (the pool)', type: :request do
  before(:each) { login_user }

  let(:project) { Project.create_with_relations!(creator_id: @current_user.id) }
  let(:track)   { project.ordered_tracks.first }

  def api(method, path, body = nil)
    send(method, "/v1/#{path}", params: body&.to_json, headers: @headers)
    response.body.present? ? json_parse(response.body) : nil
  end

  def add_sample(path, label = nil)
    attributes = { path: path }
    attributes[:label] = label if label
    api(:post, "projects/#{project.slug}/samples", { data: { type: 'project-sample', attributes: attributes } })
  end

  describe 'the onset detection threshold' do
    it 'starts at a default and is part of the sample' do
      body = add_sample('/a/loop.mp3')
      expect(body.dig(:data, :attributes, :'onset-threshold')).to eq(0.25)
    end

    it 'is changed through an update, and persists' do
      sample = ProjectSample.find(add_sample('/a/loop.mp3').dig(:data, :id))
      api(:patch, "samples/#{sample.id}", { data: { type: 'project-sample', id: sample.id.to_s, attributes: { 'onset-threshold': 0.6 } } })

      expect(response).to have_http_status(200)
      expect(sample.reload.onset_threshold).to eq(0.6)
    end

    it 'must be between 0 and 1' do
      sample = ProjectSample.find(add_sample('/a/loop.mp3').dig(:data, :id))
      [-0.1, 1.5].each do |bad|
        api(:patch, "samples/#{sample.id}", { data: { type: 'project-sample', id: sample.id.to_s, attributes: { 'onset-threshold': bad } } })
        expect(response).to have_http_status(422)
      end
      expect(sample.reload.onset_threshold).to eq(0.25)
    end
  end

  describe 'adding samples' do
    it 'adds a sample under a label taken from the file name' do
      body = add_sample('/Roland/TR 808/kick.mp3')

      expect(response).to have_http_status(200)
      expect(body.dig(:data, :attributes)).to include(path: '/Roland/TR 808/kick.mp3', label: 'kick', position: 0)
    end

    it 'stores paths with a leading slash' do
      add_sample('Roland/TR 808/kick.mp3')
      expect(project.project_samples.first.path).to eq('/Roland/TR 808/kick.mp3')
    end

    it 'returns the existing entry when the path is already in the pool' do
      first = add_sample('/a/kick.mp3')
      again = add_sample('a/kick.mp3')

      expect(again.dig(:data, :id)).to eq(first.dig(:data, :id))
      expect(project.project_samples.count).to eq(1)
    end

    it 'gives same-named files from different folders distinct labels' do
      add_sample('/Roland/kick.mp3')
      add_sample('/Korg/kick.mp3')

      expect(project.project_samples.pluck(:label)).to eq(['kick', 'kick 2'])
    end

    it 'lists the pool in order' do
      add_sample('/a/one.mp3')
      add_sample('/a/two.mp3')
      api(:get, "projects/#{project.slug}/samples")

      expect(json_parse(response.body)[:data].map { |s| s.dig(:attributes, :label) }).to eq(%w[one two])
    end

    it 'keeps each project pool separate' do
      other_project = Project.create_with_relations!(creator_id: @current_user.id)
      add_sample('/a/kick.mp3')

      expect(other_project.project_samples.count).to eq(0)
    end
  end

  describe 'renaming and ordering' do
    it 'renames a sample' do
      sample = ProjectSample.find_or_add!(project, '/a/kick.mp3')
      api(:patch, "samples/#{sample.id}", { data: { type: 'project-sample', id: sample.id.to_s, attributes: { label: 'big kick' } } })

      expect(response).to have_http_status(200)
      expect(sample.reload.label).to eq('big kick')
    end

    it 'refuses a label another sample already has' do
      ProjectSample.find_or_add!(project, '/a/kick.mp3')
      snare = ProjectSample.find_or_add!(project, '/a/snare.mp3')
      api(:patch, "samples/#{snare.id}", { data: { type: 'project-sample', id: snare.id.to_s, attributes: { label: 'kick' } } })

      expect(response).to have_http_status(422)
    end
  end

  describe 'tracks pick samples from the pool' do
    it 'adds a path used by a track to the pool automatically (older clients)' do
      control = track.filepath_controls.create!(control_value: 'Roland/kick.mp3', node_order: 0)

      expect(control.project_sample).to be_present
      expect(control.control_value).to eq('/Roland/kick.mp3')
      expect(project.project_samples.pluck(:path)).to eq(['/Roland/kick.mp3'])
    end

    it 'assigns a pool sample to a slot by id: the pool decides the path' do
      sample = ProjectSample.find_or_add!(project, '/Korg/AGG.mp3')
      api(:post, 'filepath-controls', { data: { type: 'filepath-controls', attributes: { node_order: 0, 'project-sample-id': sample.id },
                                                relationships: { track: { data: { type: 'tracks', id: track.id.to_s } } } } })

      expect(response).to have_http_status(200)
      control = track.filepath_controls.first
      expect(control.project_sample).to eq(sample)
      expect(control.control_value).to eq('/Korg/AGG.mp3')
    end

    it 'two tracks (or snapshots) using one file share a single pool entry' do
      second = Track.create_with_relations!({ project_id: project.id, file_path: '/a/kick.mp3' })
      track.filepath_controls.create!(control_value: '/a/kick.mp3', node_order: 0)

      expect(project.project_samples.count).to eq(1)
      expect(second.filepath_controls.first.project_sample_id).to eq(track.filepath_controls.first.project_sample_id)
    end

    it "refuses a sample from another project's pool" do
      foreign = ProjectSample.find_or_add!(Project.create_with_relations!(creator_id: @current_user.id), '/a/x.mp3')
      control = track.filepath_controls.build(node_order: 0, project_sample: foreign)

      expect(control).not_to be_valid
    end

    it 'follows the file when a slot is changed to another path' do
      control = track.filepath_controls.create!(control_value: '/a/kick.mp3', node_order: 0)
      control.update!(control_value: '/a/snare.mp3')

      expect(control.project_sample.path).to eq('/a/snare.mp3')
      expect(project.project_samples.count).to eq(2)
    end
  end

  describe 'removing samples' do
    it 'removes a sample nothing uses' do
      sample = ProjectSample.find_or_add!(project, '/a/kick.mp3')
      api(:delete, "samples/#{sample.id}")

      expect(response).to have_http_status(200)
      expect(ProjectSample.exists?(sample.id)).to be(false)
    end

    it 'refuses while a track still uses it, and lists the usages' do
      track.filepath_controls.create!(control_value: '/a/kick.mp3', node_order: 0)
      other = Track.create_with_relations!(project: project)
      other.filepath_controls.create!(control_value: '/a/kick.mp3', node_order: 0)
      sample = project.project_samples.first
      api(:delete, "samples/#{sample.id}")

      expect(response).to have_http_status(422)
      expect(ProjectSample.exists?(sample.id)).to be(true)

      api(:get, "projects/#{project.slug}/samples")
      usages = json_parse(response.body)[:data].first.dig(:attributes, :usages)
      expect(usages.map { |u| u[:track_id] }).to match_array([track.id, other.id])
    end
  end

  it "does not let another user change someone else's pool" do
    stranger = Project.create_with_relations!(creator_id: create(:user).id)
    sample = ProjectSample.find_or_add!(stranger, '/a/kick.mp3')
    api(:delete, "samples/#{sample.id}")

    expect(response).to have_http_status(403)
  end
end
