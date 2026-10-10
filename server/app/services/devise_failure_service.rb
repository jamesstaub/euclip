class DeviseFailureService < Devise::FailureApp
  def http_auth_body
    { error: i18n_message }.to_json
  end
end