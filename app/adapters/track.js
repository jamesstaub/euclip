import JSONAPIAdapter from '@ember-data/adapter/json-api';

export default class TrackAdapter extends JSONAPIAdapter {
  urlForDeleteRecord(trackId) {
    return `/tracks/${trackId}?include=init-script,onstep-script,track-nodes`;
  }
}
