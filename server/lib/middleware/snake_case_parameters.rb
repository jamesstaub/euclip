# Borrowed from https://www.mnishiguchi.com/2017/11/29/rails-hash-camelize-and-underscore-keys/

# A middleware that underscores the keys of any incoming (to the rails server) params
class SnakeCaseParameters
  def initialize(app)
    @app = app
  end

  def call(env)
    request = ActionDispatch::Request.new(env)
    request.request_parameters.deep_transform_keys!(&:underscore)
    request.query_parameters.deep_transform_keys!(&:underscore)

    @app.call(env)
  end
end
