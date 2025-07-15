// app/models/project.ts

import { attr, hasMany, belongsTo } from '@ember-data/model';
import { tracked } from '@glimmer/tracking';
import type UserModel from './user';
import type TrackModel from 'euclip/models/track';
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

  @hasMany('track', { async: false, inverse: 'project' })
  declare tracks: SyncHasMany<TrackModel>;

  
  /**
   * @deprecated Use ProjectModel.createSingleTrack() instead
   */
  async setupAndSaveNewTrack(track: TrackModel, saveOptions?: Record<string, unknown>): Promise<TrackModel> {
    await track.save(saveOptions);
    this.tracks.pushObject(track);
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
    return this.tracks.findBy('isMaster', true);
  }

  get orderedTracks(): TrackModel[] {
    return this.tracks.rejectBy('isMaster') as TrackModel[];
  }

  /**
   * Audio
   */

   // TODO: move bpm to ms into a common place with audio-param-config transform functions
   get loopInterval() {
    return (1000 * 60) / (this.bpm * 2);
  }

  async initSignalChain() {
    this.disconnectAll();
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
    const track = project.tracks.createRecord({ ...defaultAttributes, ...trackAttributes }) as TrackModel;
    
    try {
      // Save the track first
      await track.save();
      track.state = TrackState.SAVED;
      
      // Add to project tracks
      project.tracks.pushObject(track);
      
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
  static async createMultipleTracksInBulk(project: ProjectModel, trackConfigsArray: Array<{ attributes?: Record<string, any>, filepath?: string }>): Promise<TrackModel[]> {
    const store = project.store;
    const trackAdapter = store.adapterFor('track') as any;
    
    try {
      // Make single bulk request - backend will handle creating filepath_control records
      const response = await trackAdapter.createMultipleTracks(
        store, 
        project.slug, 
        trackConfigsArray
      );
      
      // Push the full JSON API response into the store - this will handle both tracks and included filepath-controls
      (store as any).pushPayload(response);

      // Get the created tracks from the store
      const createdTrackIds = response.data.map((trackData: any) => trackData.id);
      const tracks = createdTrackIds.map((id: any) => (store as any).peekRecord('track', id)) as TrackModel[];
      
      // Setup all tracks in parallel
      // Note: Backend has already created init scripts with sampler nodes for tracks with filepaths
      await Promise.all(tracks.map(track => this.setupTrack(track)));
      
      return tracks;
    } catch (error) {
      console.error('Error creating multiple tracks:', error);
      throw error;
    }
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
      // Find or create filepath control for this track
      const filepathControl = track.filepathControls.find(fc => fc.nodeOrder === 0) ||
        (track.store as any).createRecord('filepath-control', {
          track,
          nodeOrder: 0,
          controlValue: filepath
        });
      
      if (filepathControl.controlValue !== filepath) {
        filepathControl.controlValue = filepath;
        await filepathControl.save();
      }
      
      // Re-setup the track with the new filepath
      await this.setupTrack(track);
    } catch (error) {
      track.state = TrackState.ERROR;
      throw error;
    }
  }
}
