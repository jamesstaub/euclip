import Route from '@ember/routing/route';
import { DiscordSDK } from '@discord/embedded-app-sdk';
import ENV from 'euclip/config/environment';

export default class EmbedRoute extends Route {
  beforeModel() {    
    this.setupDiscordSdk().then((data) => {
      console.log("Discord SDK is authenticated");
      console.log(data);

  
      // We can now make API calls within the scopes we requested in setupDiscordSDK()
      // Note: the access_token returned is a sensitive secret and should be treated as such


      // Example: Fetch the current user 
      // discordSdk.commands.fetchCurrentUser()
      //   .then((user) => {
      //     // Handle the user data
      //     authenticate with ember simple auth using the discord-authenticator
            // on successful authentication, redirect to user/new
      //   })
      //   .catch((error) => {
      //     console.error("Error fetching current user:", error);
      //   });
      
    /// get the current activity instance and use it to find or create the project id
    });
  }

  async setupDiscordSdk() {
    let auth;
    const discordSdk = new DiscordSDK(ENV.APP.DISCORD_CLIENT_ID);

    await discordSdk.ready();
    console.log("Discord SDK is ready");

    // Authorize with Discord Client
    const { code } = await discordSdk.commands.authorize({
      client_id: ENV.APP.DISCORD_CLIENT_ID,
      response_type: "code",
      state: "",
      prompt: "none",
      scope: [
        "identify",
        "guilds",
        "applications.commands"
      ],
    });

    // Retrieve an access_token from your activity's server
    // Note: We need to prefix our backend `/api/token` route with `/.proxy` to stay compliant with the CSP.
    // Read more about constructing a full URL and using external resources at
    // https://discord.com/developers/docs/activities/development-guides#construct-a-full-url
    const response = await fetch("/.proxy/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
      }),
    });

    const { access_token } = await response.json();

    // Authenticate with Discord client (using the access_token)
    auth = await discordSdk.commands.authenticate({
      access_token,
    });

    if (auth == null) {
      throw new Error("Authenticate command failed");
    }
  }
}
