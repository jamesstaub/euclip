// app/models/project.ts

import { attr, hasMany, belongsTo } from '@ember-data/model';
import { tracked } from '@glimmer/tracking';
import type UserModel from './user';
import type TrackModel from 'euclip/models/track';
import type { AsyncHasMany, SyncHasMany } from '@ember-data/model';
import { resetLoop, startLoop, stopLoop, disconnectAll } from 'euclip/utils/cracked';
import Model from '@ember-data/model';

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

  // Methods
  async setupAndSaveNewTrack(track: TrackModel, saveOptions?: Record<string, unknown>): Promise<TrackModel> {
    await track.save(saveOptions);
    this.tracks.pushObject(track);
    await track.findOrDownloadSoundFile();
    await track.setupAudioFromScripts(false);
    track.createAudioFileTree();
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
      this.orderedTracks.map((track) => track.findOrDownloadSoundFile())
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
}
