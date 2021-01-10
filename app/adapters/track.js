import ApplicationAdapter from './application';
import { isArray } from '@ember/array';
import ENV from 'euclip/config/environment';

export default class TrackAdapter extends ApplicationAdapter {
  // TODO cleanup by overwriting buildUrl method
  urlForCreateRecord(modelName, snapshot) {
    let url = `/projects/${snapshot.record.project.get('slug')}/tracks?include=${ENV.APP.trackIncludeParams}`;
    if (snapshot.adapterOptions?.duplicateId) {
      // when duplicating a track, we'll need to include the duplicated track-controls in the response
      let includes = `track-controls`
      url = `${url},${includes}&duplicateId=${snapshot.adapterOptions?.duplicateId}`;
    }
    return url;
  }

  urlForFindRecord(id, modelName, { adapterOptions }) {
    // FIXME: adapter options should do the trick but findRecord is getting called mysteriously when routing to a project
    // so I'm not sure where to pass the adapterOptioons
    const slug = adapterOptions?.slug;
    return `/projects/${slug}/tracks/${id}`;
  }

  async createRecord(store) {
    const response = await super.createRecord(...arguments);
    // in cases such as track-duplcation, the "create" request returns an array 
    // because the "order" property of all other track is modified when a track is duplicated
    if (isArray(response.data)) {
      // first we find all the tracks except the newly created one and manually push them to the store
      // because their order may have changed
      const payloadWithoutNewTrack= {
        ...response,
        data: response.data.rejectBy('id', String(response.meta.created))
      }
      store.pushPayload('track', payloadWithoutNewTrack);
      
      // then munge and return a new response object to look like what the adapter's createRecord would normally
      // expect with a single newly created track record
      const payloadNewTrackOnly = {
        ...response,
        data: response.data.findBy('id', String(response.meta.created))
      }
      return payloadNewTrackOnly;
    }
    return response;
  }

  async deleteRecord(store) {
    // server updates other track order properties when a track is deleted
    const response = await super.deleteRecord(...arguments);
    store.pushPayload('track', response);
  }
}