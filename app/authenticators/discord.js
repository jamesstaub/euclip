import BaseAuthenticator from 'ember-simple-auth/authenticators/base';
import ENV from 'euclip/config/environment';

export default class DiscordAuthenticator extends BaseAuthenticator {
  oauthTokenEndpoint = `/oauth/token`;
  oauthAuthEndpoint = `/oauth/auth`;

  identificationAttributeName = 'login';
  
  async authenticate() {
    console.log('euclip; Authenticating with Discord...');
    console.log('oauthTokenEndpoint:', this.oauthTokenEndpoint);
    if (!window.isEmbed) {
      throw new Error('Discord SDK can only be initialized inside the Discord embed environment.');
    }

    const { DiscordSDK } = await import('@discord/embedded-app-sdk');
    const sdk = new DiscordSDK(ENV.APP.DISCORD_CLIENT_ID);


    await sdk.ready();

    const code = await this.getAuthCode(sdk);
    const token = await this.getAccessToken(code);

    const appAuth = await this.authenticateWithApp(token);

    return {
        token: appAuth.token,
        data: appAuth.user?.data,
      };
  }

  async getAuthCode(sdk) {
    console.log('euclip; Authorizing with Discord...');
    try {
      const { code } = await sdk.commands.authorize({
        client_id: ENV.APP.DISCORD_CLIENT_ID,
        response_type: 'code',
        state: this.generateState(),
        prompt: 'none',
        scope: ['identify', 'guilds', 'applications.commands'],
      });
      console.log('euclip; Authorization code:', code);
      return code;
    } catch (error) {
      throw new Error(`Discord authorization failed: ${error}`);
    }
  }

  async getAccessToken(code) {

    const url = new URL(this.oauthTokenEndpoint);
    url.searchParams.set('code', code);
  
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch access token');
    }

    const { access_token } = await response.json();

    return access_token;
  }

  async authenticateWithApp(token) {
    console.log('euclip; Authenticating with app...');
    const response = await fetch(this.oauthAuthEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('App authentication failed');
    }

    return response.json();
  }

  generateState() {
    return Math.random().toString(36).substring(2, 15);
  }
}
