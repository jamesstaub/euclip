Rails.application.config.content_security_policy do |policy|
  policy.connect_src :self, 'https://discord.com', 'https://*.discordsays.com'
end
