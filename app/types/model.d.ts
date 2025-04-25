import type AudioFileTreeModel from 'euclip/models/audio-file-tree';
import type FilepathControlModel from 'euclip/models/filepath-control';
import type InitScriptModel from 'euclip/models/init-script';
import type OnstepScriptModel from 'euclip/models/onstep-script';
import type PresetCollectionModel from 'euclip/models/preset-collection';
import type PresetModel from 'euclip/models/preset';
import type ProjectModel from 'euclip/models/project';
import type ScriptModel from 'euclip/models/script';
import type SequenceModel from 'euclip/models/sequence';
import type SoundFileModel from 'euclip/models/sound-file';
import type TrackControlFrequencyModel from 'euclip/models/track-control-frequency';

import type TrackNodeModel from 'euclip/models/track-node';
import type TrackModel from 'euclip/models/track';
import type UserAuthModel from 'euclip/models/user-auth';
import type UserModel from 'euclip/models/user';
import type TrackControlModel from 'euclip/models/track-control';

export default interface ModelRegistry {
  'audio-file-tree': AudioFileTreeModel;
  'filepath-control': FilepathControlModel;
  'init-script': InitScriptModel;
  'onstep-script': OnstepScriptModel;
  'preset-collection': PresetCollectionModel;
  'preset': PresetModel;
  'project': ProjectModel;
  'script': ScriptModel;
  'sequence': SequenceModel;
  'sound-file': SoundFileModel;
  'track-control-frequency': TrackControlFrequencyModel;
  'track-control': TrackControlModel;
  'track-node': TrackNodeModel;
  'track': TrackModel;
  'user-auth': UserAuthModel;
  'user': UserModel;
}
