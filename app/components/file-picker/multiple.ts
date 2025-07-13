import type StoreService from '@ember-data/store';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import type Owner from '@ember/owner';
import type AudioFileTreeModel from 'euclip/models/audio-file-tree';


interface Args{
}

export default class FilePickerMultipleComponent extends Component<Args> {
  @service declare store: StoreService;
  
  audioFileTree: AudioFileTreeModel;

  constructor(owner: Owner, args: Args) {
    super(owner, args);

    this.audioFileTree = this.store.createRecord('audio-file-tree');
  }
}
