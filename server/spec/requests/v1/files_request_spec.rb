require 'rails_helper'

RSpec.describe 'V1::Files', type: :request do
  let(:files_path) { "/#{API_VERSION}/files" }

  before(:each) do
    SearchableDirectory.create!(name: '/')
    FileService.create_record('Roland/TR 808/kick.mp3')
    FileService.create_record('WAV hh+filterloops/loop 1.mp3')
    login_user
  end

  def listing(path)
    get "#{files_path}#{path}", headers: @auth_header
    json_parse(response.body)
  end

  it 'lists the top-level folders' do
    body = listing('/')

    expect(response).to have_http_status(200)
    expect(body[:dirs]).to include('Roland', 'WAV hh+filterloops')
  end

  it 'lists the files in a nested folder' do
    body = listing('/Roland/TR%20808')

    expect(response).to have_http_status(200)
    expect(body[:audio].to_s).to include('kick.mp3')
  end

  it 'finds a folder whose name contains a plus (encoded)' do
    listing('/WAV%20hh%2Bfilterloops')

    expect(response).to have_http_status(200)
    expect(json_parse(response.body)[:audio].to_s).to include('loop 1.mp3')
  end

  it 'finds a folder whose name contains a literal plus' do
    listing('/WAV%20hh+filterloops')

    expect(response).to have_http_status(200)
    expect(json_parse(response.body)[:audio].to_s).to include('loop 1.mp3')
  end

  it 'returns 404 for an unknown folder' do
    listing('/Nope')

    expect(response).to have_http_status(404)
  end

  it 'is a public, read-only index (no credentials needed)' do
    cookies.delete('_euclip_session')
    get "#{files_path}/", headers: { Accept: APP_JSON }

    expect(response).to have_http_status(200)
  end

  describe 'search' do
    def search(q)
      get "#{files_path}/search", params: { q: q, page: 0 }, headers: @auth_header
      json_parse(response.body)[:results].flat_map { |r| r[:files] }.map { |f| f[:filename] }
    end

    it 'matches file paths case-insensitively' do
      expect(search('KICK')).to eq(['kick.mp3'])
    end

    it 'treats % and _ literally instead of as wildcards' do
      expect(search('%')).to be_empty
      expect(search('ki_k')).to be_empty
    end
  end
end
