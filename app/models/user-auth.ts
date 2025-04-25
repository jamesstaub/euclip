// app/models/user.ts
import Model, { attr, belongsTo } from '@ember-data/model';
import type UserModel from './user';

interface DiscordExtraData {
  id: string;
  clan: null | string;
  flags: number;
  avatar: string | null;
  banner: string | null;
  locale: string;
  username: string;
  global_name: string | null;
  mfa_enabled: boolean;
  accent_color: number | null;
  banner_color: string | null;
  collectibles: unknown | null;
  premium_type: number;
  public_flags: number;
  discriminator: string;
  primary_guild: string | null;
  avatar_decoration_data: unknown | null;
}

export default class UserAuthModel extends Model {
  @attr('string') declare username: string;
  @attr('string') declare provider: string;
  @attr('string') declare uid: string;
  @attr('string') declare access_token: string;
  @attr('date') declare token_expires_at: Date;
  @attr() declare extra_data: DiscordExtraData;  // <-- Now strongly typed
  @attr('string') declare avatarId: string;
  @belongsTo('user', { async: false, inverse: 'userAuth' }) user!: UserModel;


  get avatarUrl() {
    if (this.avatarId && this.provider === 'discord') {
      return `https://cdn.discordapp.com/avatars/${this.uid}/${this.avatarId}.png`;
    }
    return null;
  }
}
