class DiscordUserService
  def self.create_or_update_user(discord_user_info, access_token)
    user = User.find_or_initialize_by(discord_id: discord_user_info["id"])
    user.username = discord_user_info["username"]
    user.email = "#{discord_user_info['id']}@discord.com" # Placeholder email
    user.password = SecureRandom.hex(16) if user.new_record? # Generate a random password for new users
    user.save!

    user_auth = UserAuth.find_or_initialize_by(provider: "discord", uid: discord_user_info["id"])
    user_auth.user = user
    user_auth.access_token = access_token
    user_auth.avatar_id = discord_user_info["avatar"]
    user_auth.extra_data = discord_user_info
    user_auth.save!

    user
  end
end
