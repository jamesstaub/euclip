import Route from '@ember/routing/route';
import { DiscordSDK } from '@discord/embedded-app-sdk';
import ENV from 'euclip/config/environment';
import { inject as service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import type SessionService from 'ember-simple-auth/services/session';

declare global {
  interface Window {
    isEmbed?: boolean;
  }
}

function generateState() {
  return Math.random().toString(36).substring(2, 15);
}

export default class EmbedRoute extends Route {
  @service router!: RouterService;
  @service store!: SessionService;

  async beforeModel() {
    console.log('euclip; embed route!');

    try {
      const discordAuth = await this.initializeDiscordSdk();
      const appAuth = await this.authenticateWithApp(discordAuth.access_token);

      console.log('euclip; App authentication successful:', appAuth);
      this.router.transitionTo('user.new');
    } catch (error) {
      console.error('euclip; Error during embed route initialization:', error);
      throw new Error('Failed to initialize embed route');
    }
  }

  async initializeDiscordSdk() {
    console.log('euclip; Initializing Discord SDK...');

    if (!window.isEmbed) {
      throw new Error('Discord SDK can only be initialized inside the Discord embed environment.');
    }

    const sdk = new DiscordSDK(ENV.APP['DISCORD_CLIENT_ID'] as string);
    await this.waitForReady(sdk);

    const code = await this.getAuthCode(sdk);
    const token = await this.getAccessToken(code);

    return this.authenticateClient(sdk, token);
  }


  async waitForReady(sdk: DiscordSDK) {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Discord SDK ready() timed out')), 5000)
    );
    await Promise.race([sdk.ready(), timeout]);
    console.log('euclip; Discord SDK is ready');
  }

  async getAuthCode(sdk: DiscordSDK) {
    console.log('euclip; Authorizing with Discord...');
    try {
      const { code } = await sdk.commands.authorize({
        client_id: ENV.APP['DISCORD_CLIENT_ID'] as string,
        response_type: 'code',
        state: generateState(),
        prompt: 'none',
        scope: ['identify', 'guilds', 'applications.commands'],
      });
      console.log('euclip; Authorization code:', code);
      return code;
    } catch (error) {
      throw new Error(`Discord authorization failed: ${error}`);
    }
  }

  async getAccessToken(code: string) {
    console.log('euclip; Fetching access token...');
    const response = await fetch(`${ENV.APP['PROXY_PREFIX']}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch access token');
    }

    const { access_token } = await response.json();
    console.log('euclip; Access token received');
    return access_token;
  }

  async authenticateClient(sdk: DiscordSDK, token: string) {
    console.log('euclip; Authenticating Discord client...');
    const auth = await sdk.commands.authenticate({ access_token: token });

    if (!auth) {
      throw new Error('Discord client authentication failed');
    }

    console.log('euclip; Discord client authenticated');
    return { ...auth, access_token: token };
  }

  async authenticateWithApp(token: string) {
    console.log('euclip; Authenticating with app...');
    const response = await fetch(`${ENV.APP['PROXY_PREFIX']}/oauth/auth`, {
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
}
