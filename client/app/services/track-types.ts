import Service, { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import type Store from '@ember-data/store';

export interface TrackTypeInfo {
  key: string;
  title: string;
  description: string;
  // applied once the track's audio exists: "nodeType.attr" => { unit: 'Loop Sync' }
  controls: Record<string, { unit?: string }>;
}

// shown if the API's list can't be loaded, so adding a plain sampler always works
const FALLBACK: TrackTypeInfo[] = [
  { key: 'sampler', title: 'Sampler', description: 'Plays one sample on each hit.', controls: {} },
];

/**
 * The kinds of track the "New Track" menu offers (served by the API from its TrackType registry).
 */
export default class TrackTypesService extends Service {
  @service declare store: Store;
  @tracked types: TrackTypeInfo[] = FALLBACK;
  private loaded?: Promise<void>;

  load(): Promise<void> {
    this.loaded ??= (async () => {
      try {
        const adapter: any = this.store.adapterFor('application');
        const response = await adapter.ajax('/v1/track-types', 'GET');
        this.types = response.data.map((item: any) => ({
          key: item.id,
          title: item.attributes.title,
          description: item.attributes.description,
          controls: item.attributes.controls ?? {},
        }));
      } catch (error) {
        console.error('Could not load track types; offering a plain sampler only', error);
        this.loaded = undefined; // try again next time
      }
    })();
    return this.loaded;
  }

  find(key: string): TrackTypeInfo | undefined {
    return this.types.find((type) => type.key === key);
  }
}
