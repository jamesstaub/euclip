// app/models/project.ts

import { attr, hasMany, belongsTo } from '@ember-data/model';
import { tracked } from '@glimmer/tracking';
import type UserModel from './user';
import type TrackModel from 'euclip/models/track';
import type SnapshotModel from 'euclip/models/snapshot';
import type ProjectSampleModel from 'euclip/models/project-sample';
import type { AsyncHasMany, SyncHasMany } from '@ember-data/model';
import { resetLoop, startLoop, stopLoop, disconnectAll } from 'euclip/utils/cracked';
import Model from '@ember-data/model';
import { TrackState } from './track';

export default class ProjectModel extends Model {
  @tracked declare isPlaying: boolean;

  @attr('string') declare title: string;
  @attr('string') declare slug: string;
  @attr('number') declare bpm: number;
  @attr('number', { defaultValue: 0 }) declare stepIndex: number;

  @belongsTo('user', { async: false, inverse: 'projects' })
  declare creator: UserModel;

  // A project is a set of snapshots; each is a complete set of tracks with its own tempo, and the active
  // one is what is being played and edited. The sample pool belongs to the project (all snapshots share it).
  @hasMany('snapshot', { async: false, inverse: 'project' })
  declare snapshots: SyncHasMany<SnapshotModel>;

  @belongsTo('snapshot', { async: false, inverse: null })
  declare activeSnapshot: SnapshotModel;

  @hasMany('project-sample', { async: false, inverse: 'project' })
  declare projectSamples: SyncHasMany<ProjectSampleModel>;

  // The tracks of the active snapshot. Everything that worked on "the project's tracks" keeps working:
  // reading, and creating (tracks are created inside the active snapshot).
  get tracks(): SyncHasMany<TrackModel> {
    return (this.activeSnapshot?.tracks ?? []) as SyncHasMany<TrackModel>;
  }

  
  /**
   * @deprecated Use ProjectModel.createSingleTrack() instead
   */
  async setupAndSaveNewTrack(track: TrackModel, saveOptions?: Record<string, unknown>): Promise<TrackModel> {
    await track.save(saveOptions);
    this.tracks.push(track);
    await track.findOrDownloadSoundFiles();
    await track.setupAudioFromScripts(false);
    track.createAudioFileTree();
    track.state = TrackState.SETUP;
    return track;
  }

  get displayTitle(): string {
    return this.title || 'untitled';
  }

  get masterTrack(): TrackModel | undefined {
    return this.tracks.find((item) => item.isMaster === true);
  }

  get orderedTracks(): TrackModel[] {
    return this.tracks.filter((item) => !item.isMaster).filter((track: TrackModel) => !track.isRemoved) as TrackModel[];
  }

  /**
   * Audio
   */

   // TODO: move bpm to ms into a common place with audio-param-config transform functions
   get loopInterval() {
    return (1000 * 60) / (this.bpm * 2);
  }

  async initSignalChain() {
    // Tear down only the active snapshot's audio. (disconnectAll() ends in cracked's global reset, which
    // would also destroy any other snapshot that is built and waiting to be switched in.)
    this.tracks.forEach((track) => track.unbindAndRemoveCrackedNodes());
    this.masterTrack?.setupAudioFromScripts();
    await this.downloadTrackSamples();
    this.orderedTracks.map((track) => track.setupAudioFromScripts());
    return this;
  }

  async downloadTrackSamples() {
    return await Promise.all(
      this.orderedTracks.map((track) => track.findOrDownloadSoundFiles())
    );
  }

  startLoop() {
    startLoop(this.loopInterval);
    this.isPlaying = true;
    return this;
  }

  stopLoop() {
    this.isPlaying = false;
    stopLoop();
    return this;
  }

  disconnectAll() {
    // remove all existing cracked audio nodes
    disconnectAll()
    return this;
  }

  resetLoop() {
    this.stepIndex = -1;
    this.tracks.forEach((track) => (track.stepIndex = -1));
    resetLoop();
    return this;
  }

  /**
   * Static methods for track creation and management
   */
  static async createSingleTrack(project: ProjectModel, trackAttributes: Record<string, any> = {}): Promise<TrackModel> {
    const defaultAttributes = { hits: 1, state: TrackState.CREATED };
    const track = project.activeSnapshot.tracks.createRecord({
      project,
      ...defaultAttributes,
      ...trackAttributes,
    }) as TrackModel;
    
    try {
      // Save the track first
      await track.save();
      track.state = TrackState.SAVED;
      
      // Add to project tracks
      project.tracks.push(track);
      
      // Setup the track
      await this.setupTrack(track);
      
      return track;
    } catch (error) {
      track.state = TrackState.ERROR;
      throw error;
    }
  }
  
  static async createMultipleTracks(project: ProjectModel, trackConfigsArray: Array<{ attributes?: Record<string, any>, filepath?: string }>): Promise<TrackModel[]> {
    const tracks: TrackModel[] = [];
    
    for (const config of trackConfigsArray) {
      try {
        const track = await this.createSingleTrack(project, config.attributes);
        
        // If filepath is provided, set it up
        if (config.filepath) {
          await this.setTrackFilepath(track, config.filepath);
        }
        
        tracks.push(track);
      } catch (error) {
        console.error('Error creating track:', error);
        // Continue with other tracks even if one fails
      }
    }
    
    return tracks;
  }
  
  /**
   * Creates multiple tracks in a single API request using custom adapter method
   * Backend will automatically create filepath_control records for any provided filepaths
   */
  static async createMultipleTracksInBulk(project: ProjectModel, trackConfigsArray: Array<{ attributes?: Record<string, any>, filepath?: string, trackNumber?: number }>): Promise<TrackModel[]> {
    const store = project.store;
    const trackAdapter = store.adapterFor('track') as any;
    
    try {
      // Group files by track number to support multiple files per track
      const trackGroups = new Map<number, Array<{ attributes?: Record<string, any>, filepath?: string }>>();
      
      trackConfigsArray.forEach(config => {
        const trackNumber = config.trackNumber || project.getNextTrackOrder();
        if (!trackGroups.has(trackNumber)) {
          trackGroups.set(trackNumber, []);
        }
        trackGroups.get(trackNumber)?.push({
          attributes: config.attributes,
          filepath: config.filepath
        });
      });
      
      // Create tracks for each group
      const allTracks: TrackModel[] = [];
      
      for (const [trackNumber, configs] of trackGroups.entries()) {
        // For multiple files per track, create one track with the first file
        // and add additional files as separate filepath controls
        const primaryConfig = configs[0];
        
        const response = await trackAdapter.createMultipleTracks(
          store, 
          project.slug, 
          [{
            ...primaryConfig,
            attributes: {
              ...primaryConfig.attributes,
              order: trackNumber
            }
          }]
        );
        
        // Push the full JSON API response into the store
        (store as any).pushPayload(response);
        
        const createdTrackIds = response.data.map((trackData: any) => trackData.id);
        const tracks = createdTrackIds.map((id: any) => (store as any).peekRecord('track', id)) as TrackModel[];
        
        // Setup track
        await Promise.all(tracks.map(track => this.setupTrack(track)));
        
        // Add additional files as filepath controls if there are more than one
        if (configs.length > 1) {
          const track = tracks[0];
          for (let i = 1; i < configs.length; i++) {
            const config = configs[i];
            if (config.filepath) {
              // Create additional filepath control
              const filepathControl = store.createRecord('filepath-control', {
                track: track,
                controlValue: config.filepath,
                nodeOrder: i // This will be the order for the additional sampler nodes
              });
              await filepathControl.save();
            }
          }
          
          // Re-setup the track to handle multiple filepath controls
          await this.setupTrack(track);
        }
        
        allTracks.push(...tracks);
      }
      
      return allTracks;
    } catch (error) {
      console.error('Error creating multiple tracks:', error);
      throw error;
    }
  }
  
  getNextTrackOrder(): number {
    const maxOrder = this.orderedTracks.reduce((max, track) => Math.max(max, track.order), 0);
    return maxOrder + 1;
  }
  
  static async setupTrack(track: TrackModel): Promise<void> {
    try {      
      
      await track.findOrDownloadSoundFiles();      
      await track.setupAudioFromScripts(false);
      
      track.createAudioFileTree();
      track.state = TrackState.SETUP;
    } catch (error) {
      track.state = TrackState.ERROR;
      throw error;
    }
  }
  
  static async setTrackFilepath(track: TrackModel, filepath: string): Promise<void> {
    try {
      // slot 0 is the track's first sampler; setFile downloads, saves and rebuilds the audio
      await track.setFile(0, filepath);
      track.state = TrackState.SETUP;
    } catch (error) {
      track.state = TrackState.ERROR;
      throw error;
    }
  }
}
