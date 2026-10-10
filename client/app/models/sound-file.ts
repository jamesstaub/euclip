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
} as const;

type SoundFileState = typeof SoundFileStates[keyof typeof SoundFileStates];

// Local ephemeral model created when an audio file is downloaded.
// Stores reference to the local URL and metadata
export default class SoundFileModel extends Model {
  // Static ID counter for each instance
  static ID = 0;

  @tracked state: SoundFileState = SoundFileStates.INIT;

  // Error message in case of download failure
  @tracked errorMessage: string | null = null;

  // The relative file path (without root) that matches the search endpoint results
  @attr('string') filePathRelative!: string;

  // The local URL of the downloaded file
  @attr('string') downloadedURI!: string;

  // Order of the sound file (defaults to static ID counter)
  @attr('number', {
    defaultValue() {
      return SoundFileModel.ID++;
    },
  })
  order!: number;

  // Computed property to check if the file is downloaded
  get isDownloaded(): boolean {
    return this.state === SoundFileStates.DOWNLOADED;
  }

  // Computed property to check if the file is in the process of being downloaded
  get isDownloading(): boolean {
    return this.state === SoundFileStates.DOWNLOADING;
  }

  /**
   * After the creation of the sound file model, we transition to the downloading state,
   * then attempt to download the file and update the state accordingly.
   */
  async afterCreate(): Promise<void> {
    this.transitionToState(SoundFileStates.DOWNLOADING);
    try {
      const uri = await SoundFileModel.downloadSoundFile(this.filePathRelative);
      this.downloadedURI = uri;
      this.transitionToState(SoundFileStates.DOWNLOADED);
    } catch (error) {
      // TODO: Trace where to pass the download error to the user
      this.transitionToState(SoundFileStates.ERROR, { error });
    }
  }

  /**
   * Generate the full URL for the sound file based on the file path.
   */
  get filepathUrl(): string {
    return `${ENV.APP['DRUMMACHINES_CDN_PATH']}/${this.filePathRelative}`;
  }

  /**
   * Downloads the sound file using the provided relative file path.
   */
  static async downloadSoundFile(filePathRelative: string): Promise<string> {
    // The root path is derived based on the environment and the file path
    const url =
      filePathRelative?.startsWith(`${ENV.APP['ASSETS_PATH']}`)
        ? filePathRelative
        : `${ENV.APP['DRUMMACHINES_CDN_PATH']}${filePathRelative}`;

    if (!url) throw new Error('No URL provided to create sound file');

    const response = await fetch(url);
    const blob = await response.blob();

    const mimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav'];
    if (mimeTypes.includes(blob.type)) {
      return URL.createObjectURL(blob);
    } else {
      throw `Audio File Not Found at ${url}`;
    }
  }

  /**
   * Finds or downloads the sound file by its relative path.
   * If the file is not yet downloaded, it will create and download it.
   */
  static async findOrDownload(
    filePathRelative: string,
    store: any
  ): Promise<SoundFileModel> {
    // Search for the sound file by its relative path
    let soundFile = store
      .peekAll('sound-file')
      .findBy('filePathRelative', filePathRelative);

    if (soundFile?.isDownloading) {
      // Wait until the file has finished downloading or errored out
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

  /**
   * Deletes the sound file and cleans up resources.
   */
  static deleteSoundFile(soundFile: SoundFileModel): void {
    soundFile.transitionToState(SoundFileStates.DELETED);
    if (soundFile) {
      URL.revokeObjectURL(soundFile.downloadedURI);
      soundFile.destroyRecord();
    }
  }

  /**
   * Transitions the sound file state and assigns an optional error message.
   */
  transitionToState(newState: SoundFileState, data?: { error?: any }): void {
    this.state = newState;
    this.errorMessage = data?.error || null;
  }
}
