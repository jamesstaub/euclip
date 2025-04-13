import Route from '@ember/routing/route';
import { DiscordSDK } from '@discord/embedded-app-sdk';
import ENV from 'euclip/config/environment';

export default class EmbedRoute extends Route {
  beforeModel() {
    const discordSdk = new DiscordSDK(ENV.APP.DISCORD_CLIENT_ID);

    setupDiscordSdk().then(() => {
      console.log('Discord SDK is ready');
    });

    async function setupDiscordSdk() {
      await discordSdk.ready();
    }
  }
}
