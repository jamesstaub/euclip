require 'rack/proxy'

class Proxy < Rack::Proxy
  def initialize(app, opts = {})
    @app = app
    @drumserver_host = "127.0.0.1:8000"
    @drumserver_host = "drumserver.herokuapp.com" if Rails.env.production? 
  end

  def call(env)
    # call super if we want to proxy, otherwise just handle regularly via call    
    if proxy?(env)
      rewrite_env(env)
      perform_request(env)
    else
      @app.call(env)
    end
  end

  def proxy?(env)
    request = Rack::Request.new(env)
    # do not alter env here, but return true if you want to proxy for this request.
    return request.path =~ %r{^/drumserver}
  end

  def rewrite_env(env)
    unless Rails.env.production?
      env["rack.ssl_verify_none"] = true
      env["HTTP_X_FORWARDED_PROTO"] = "https"
      env["rack.url_scheme"] = "https"
    end
    env["HTTP_HOST"] = @drumserver_host
    env["REQUEST_PATH"] = remove_prefix(env["REQUEST_PATH"])
    env["REQUEST_URI"] = remove_prefix(env["REQUEST_URI"])
    env["PATH_INFO"] = remove_prefix(env["PATH_INFO"])
  end

  def remove_prefix(str)
    str = str.delete_prefix("/drumserver")
    str = "/" if str.empty?
    str
  end

end
