require 'net/http'
require 'uri'
require 'json'

class HttpService
  def self.post(uri, headers: {}, form_data: {})
    request = Net::HTTP::Post.new(uri)
    headers.each { |key, value| request[key] = value }
    request.set_form_data(form_data)

    execute_request(uri, request)
  end

  def self.get(uri, headers: {})
    request = Net::HTTP::Get.new(uri)
    headers.each { |key, value| request[key] = value }

    execute_request(uri, request)
  end

  private

  def self.execute_request(uri, request)
    http = Net::HTTP.new(uri.hostname, uri.port)
    http.use_ssl = uri.scheme == 'https'
    http.open_timeout = 5
    http.read_timeout = 5

    response = http.request(request)
    handle_response(response)
  rescue Net::OpenTimeout, Net::ReadTimeout => e
    raise "Request timed out: #{e.message}"
  rescue StandardError => e
    raise "HTTP request failed: #{e.message}"
  end

  def self.handle_response(response)
    if response.is_a?(Net::HTTPSuccess)
      JSON.parse(response.body)
    else
      raise "HTTP error #{response.code}: #{response.body}"
    end
  end
end
