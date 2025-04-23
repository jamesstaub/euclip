export interface EmberENV {
  FEATURES: Record<string, boolean>;
}

export interface ContentSecurityPolicy {
  'connect-src': string;
}

export interface EmberSimpleAuth {
  routeAfterAuthentication: string;
}

export interface AppConfig {
  registrationEndpoint: string;
  userEndpoint: string;
  invalidateEndpoint: string;
  DISCORD_CLIENT_ID: string;
  PROXY_PREFIX: string;
  API_PREFIX: string;
  ASSETS_PATH: string;
  AUDIO_CDN_ROOT: string;
  DRUMMACHINES_PATH: string;
  DRUMMACHINES_CDN_PATH: string;
  DRUMMACHINES_PROXY_PATH: string;
  LOG_ACTIVE_GENERATION?: boolean;
  LOG_VIEW_LOOKUPS?: boolean;
  rootElement?: string;
  autoboot?: boolean;
}

export interface EnvironmentConfig {
  modulePrefix: string;
  environment: string;
  rootURL: string;
  locationType: string;
  EmberENV: EmberENV;
  contentSecurityPolicy: ContentSecurityPolicy;
  'ember-simple-auth': EmberSimpleAuth;
  APP: AppConfig;
}
