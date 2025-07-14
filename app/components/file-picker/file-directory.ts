import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import type { DirectoryModel } from 'euclip/models/audio-file-tree';

interface FilePickerFileDirectorySignature {
  Args: {
    directory: DirectoryModel;
    onSelectItem: (directory: DirectoryModel, item: string) => void;
  };
  Element: HTMLDivElement;
}

export default class FilePickerFileDirectoryComponent extends Component<FilePickerFileDirectorySignature> {
  @tracked selected: string | undefined;
  @tracked shouldScrollTo: boolean | undefined;
  @tracked scrollBehavior: 'auto' | 'smooth' = 'auto';

  constructor(owner: any, args: FilePickerFileDirectorySignature['Args']) {
    super(owner, args);
    this.scrollBehavior = 'auto';
  }

  @action
  selectItem(directory: DirectoryModel, item: string): void {
    /**
     * FIXME: applying scrollbehavior dynamically doesn't work well for the the top level
     * directory for some reason
     */
    this.scrollBehavior = 'smooth';
    this.args.onSelectItem(directory, item);
    directory.onSelectItem(item);
  }
}
