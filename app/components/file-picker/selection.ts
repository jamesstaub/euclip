import Component from '@glimmer/component';
import type { DirectoryModel } from 'euclip/models/audio-file-tree';

interface SelectedAudioFile {
  filepath: string;
  filename: string;
  isSelected: boolean;
}

interface FilePickerSelectionSignature {
  Args: {
    directoryTree: DirectoryModel[];
    onSelectItem: (directory: DirectoryModel, item: string) => void;
    showCheckboxes?: boolean;
    selectedFiles?: SelectedAudioFile[];
    onToggleFileSelection?: (filepath: string) => void;
    canSelectMoreFiles?: boolean;
    maxSelectableFiles?: number;
  };
}

export default class FilePickerSelectionComponent extends Component<FilePickerSelectionSignature> {
  get shouldShowCheckboxes(): boolean {
    return this.args.showCheckboxes ?? false;
  }

  get selectedFiles(): SelectedAudioFile[] {
    return this.args.selectedFiles ?? [];
  }

  isFileSelected(filepath: string): boolean {
    return this.selectedFiles.some(
      (f) => f.filepath === filepath && f.isSelected
    );
  }
}
