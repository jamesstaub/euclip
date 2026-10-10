import Model, { attr } from '@ember-data/model';
import { tracked } from '@glimmer/tracking';
import ENV from 'euclip/config/environment';
import { debugLog } from 'euclip/utils/debug-log';
import encodeFilePath from 'euclip/utils/encode-file-path';

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
// stored paths are normally "/Folder/file.mp3", but "Folder/file.mp3" must not silently 404
function withLeadingSlash(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

export default class SoundFileModel extends Model {
  // Static ID counter for each instance
  static ID = 0;

  @tracked state: SoundFileState = SoundFileStates.INIT;
  // length in seconds, known once the audio has been decoded; lets a rebuilt sampler node know it
  // straight away (Loop Sync speed needs it) instead of only after its own decode finishes
  @tracked duration?: number;

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
      debugLog('sound-file', 'download failed', this.filePathRelative, error);
      this.transitionToState(SoundFileStates.ERROR, { error });
    }
  }

  /**
   * Generate the full URL for the sound file based on the file path.
   */
  get filepathUrl(): string {
    return `${ENV.APP['DRUMMACHINES_CDN_PATH']}${encodeFilePath(withLeadingSlash(this.filePathRelative))}`;
  }

  /**
   * Downloads the sound file using the provided relative file path.
   */
  static async downloadSoundFile(filePathRelative: string): Promise<string> {
    // The root path is derived based on the environment and the file path
    const url =
      filePathRelative?.startsWith(`${ENV.APP['ASSETS_PATH']}`)
        ? filePathRelative
        : `${ENV.APP['DRUMMACHINES_CDN_PATH']}${encodeFilePath(withLeadingSlash(filePathRelative))}`;

    if (!url) throw new Error('No URL provided to create sound file');

    const response = await fetch(url);
    debugLog('sound-file', 'fetch', url, response.status, response.headers.get('content-type'));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching ${url}`);
    }
    const blob = await response.blob();

    const mimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave'];
    if (mimeTypes.includes(blob.type)) {
      return URL.createObjectURL(blob);
    } else {
      throw new Error(`Not an audio file (got ${blob.type || 'unknown type'}) at ${url}`);
    }
  }

  /**
   * Finds or downloads the sound file by its relative path.
   * If the file is not yet downloaded, it will create and download it.
   */
  // downloads currently running, by path: callers asking for the same file share one record and one request
  static inflight = new Map<string, Promise<SoundFileModel>>();

  static findOrDownload(filePathRelative: string, store: any): Promise<SoundFileModel> {
    const existing: SoundFileModel | undefined = store
      .peekAll('sound-file')
      .find((item: SoundFileModel) => item.filePathRelative === filePathRelative);

    if (existing?.isDownloaded) return Promise.resolve(existing);

    const pending = SoundFileModel.inflight.get(filePathRelative);
    if (pending) return pending;

    // a failed earlier attempt is retried on the same record: creating another record for the same
    // path would leave duplicates behind, one stuck in the error state
    const download = (async () => {
      const soundFile: SoundFileModel =
        existing ?? store.createRecord('sound-file', { filePathRelative });
      await soundFile.afterCreate();
      return soundFile;
    })().finally(() => SoundFileModel.inflight.delete(filePathRelative));

    SoundFileModel.inflight.set(filePathRelative, download);
    return download;
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
