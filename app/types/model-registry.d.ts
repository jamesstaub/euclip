import type UserModel from 'euclip/models/user';
import type ProjectModel from 'euclip/models/project';
import type TrackModel from 'euclip/models/track';


declare module 'ember-data/types/registries/model' {
  export default interface ModelRegistry {
    user: UserModel;
    project: ProjectModel;
    track: TrackModel;
    'init-script': InitScriptModel;
    'onstep-script': OnstepScriptModel;
    'audio-file-tree': AudioFileTreeModel;
    'track-node': TrackNodeModel;
    'track-control': TrackControlModel;
    'filepath-control': FilepathControlModel;
    sequence: SequenceModel;
    'sound-file': SoundFileModel;

  }
}
