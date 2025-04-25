declare module 'ember-responsive' {
  import Service from '@ember/service';

  export interface ScreenInfo {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isWidescreen: boolean;
    isHuge: boolean;
  }

  export default class MediaService extends Service {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isWidescreen: boolean;
    isHuge: boolean;

    match(mediaQuery: string): boolean;
    addObserverFor(mediaQuery: string, callback: () => void): void;
    removeObserverFor(mediaQuery: string, callback: () => void): void;
  }
}
