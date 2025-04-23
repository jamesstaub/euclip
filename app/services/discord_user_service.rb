class DiscordUserService
  def self.create_or_update_user(discord_user_info, access_token)
    # Find or initialize the user by a unique placeholder email
    user = User.find_or_initialize_by(email: "#{discord_user_info['id']}@discord.com")

    # Update user attributes only if they have changed
    user.assign_attributes(
      username: discord_user_info["username"]
    ) if user.new_record? || user.username != discord_user_info["username"]

    user.password = SecureRandom.hex(16) if user.new_record? # Generate a random password for new users
    user.save! # Save the user, raising an error if validations fail

    # Find or initialize the UserAuth record
    user_auth = UserAuth.find_or_initialize_by(provider: "discord", uid: discord_user_info["id"])
    user_auth.assign_attributes(
      user: user,
      access_token: access_token,
      avatar_id: discord_user_info["avatar"],
      extra_data: discord_user_info
    )
    user_auth.save! # Save the UserAuth record, raising an error if validations fail

    user
  end
end
