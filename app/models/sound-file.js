import Model, { attr } from '@ember-data/model';
import { tracked } from '@glimmer/tracking';
import { waitForProperty } from 'ember-concurrency';
import ENV from 'euclip/config/environment';

export const SoundFileStates = {
  INIT: 'init',
  DOWNLOADING: 'downloading',
  DOWNLOADED: 'downloaded',
  ERROR: 'error',
  DELETED: 'deleted',
};

// Local ephemeral model that is created when an audio file is downloaded.
// Stores reference to local url and metadata
export default class SoundFileModel extends Model {
  static ID = 0;

  @tracked state = SoundFileStates.INIT;
  state;

  @attr('string')
  filePathRelative; // the path without a root, matching the search endpoint results

  @attr('string')
  errorMessage;

  @attr('string')
  downloadedURI; // the local url of the downloaded file

  @attr('number', {
    defaultValue() {
      return SoundFileModel.ID++;
    },
  })
  order;

  get isDownloaded() {
    return this.state === SoundFileStates.DOWNLOADED;
  }

  get isDownloading() {
    return this.state === SoundFileStates.DOWNLOADING;
  }

  // ideally the creation params would be available in the constructor but they are not
  // so always call this after creating a soundfile
  async afterCreate() {
    this.transitionToState(SoundFileStates.DOWNLOADING);
    try {
      const uri = await SoundFileModel.downloadSoundFile(this.filePathRelative);
      this.downloadedURI = uri;
      this.transitionToState(SoundFileStates.DOWNLOADED);
    } catch (error) {
      // TOOD: trace where to pass the download error to user
      this.transitionToState(SoundFileStates.ERROR, { error });
    }
  }

  get filepathUrl() {
    return `${ENV.APP.DRUMMACHINES_PATH}${this.filePathRelative}`;
  }

  static async downloadSoundFile(filePathRelative) {
    // TODO: this should get a root path from the caller, eg the Search API vs
    // some other input from the user.
    // the API can provide different roots for development vs production
    // the sound file record should have unique root/filepath pairs

    const url = filePathRelative?.startsWith('/assets/')
      ? filePathRelative
      : `${ENV.APP.DRUMMACHINES_PATH}${filePathRelative}`;

    if (!url) throw new Error('No url provided to create sound file');

    const response = await fetch(url);
    const blob = await response.blob();

    const mimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav'];
    if (mimeTypes.includes(blob.type)) {
      return URL.createObjectURL(blob);
    } else {
      throw `Audio File Not Found at ${url}`;
    }
  }

  static async findOrDownload(filePathRelative, store) {
    // TODO: eventually will want to findBy filepath + root to allow
    // sources other than drummachines directory
    let soundFile = store
      .peekAll('sound-file')
      .findBy('filePathRelative', filePathRelative);

    if (soundFile?.isDownloading) {
      // could be error or success
      await waitForProperty(soundFile, 'isDownloading', false);
    }

    if (!soundFile?.isDownloaded) {
      soundFile = store.createRecord('sound-file', {
        filePathRelative: filePathRelative,
      });
      await soundFile.afterCreate();
    }

    return soundFile;
  }

  // TODO:
  // when to cleanup downloaded audio (on exit project?, on delete trackNode?)
  // should be ok to always delete when track-node is destroyed
  static deleteSoundFile(soundFile) {
    soundFile.transitionToState(SoundFileStates.DELETING);
    if (soundFile) {
      URL.revokeObjectURL(soundFile.downloadedURI);
      soundFile.destroyRecord();
    }
  }

  transitionToState(newState, data) {
    this.state = newState;
    this.errorMessage = data?.error;
  }
}
