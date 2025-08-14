import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import type { DirectoryModel } from 'euclip/models/audio-file-tree';

interface SelectedAudioFile {
  filepath: string;
  filename: string;
  isSelected: boolean;
}

interface FilePickerFileDirectorySignature {
  Args: {
    directory: DirectoryModel;
    onSelectItem: (directory: DirectoryModel, item: string) => void;
    showCheckboxes?: boolean;
    selectedFiles?: SelectedAudioFile[];
    onToggleFileSelection?: (filepath: string) => void;
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

  get selectedFiles(): SelectedAudioFile[] {
    return this.args.selectedFiles ?? [];
  }

  buildFilePath(path: string, filename: string): string {
    return path.endsWith('/') ? `${path}${filename}` : `${path}/${filename}`;
  }

  isFileSelected(filepath: string): boolean {
    try {
      if (!filepath) return false;
      
      const files = this.args.selectedFiles;
      if (!files || !Array.isArray(files) || files.length === 0) {
        return false;
      }
      return files.some(
        (f) =>
          f &&
          typeof f === 'object' &&
          typeof f.filepath === 'string' &&
          f.filepath === filepath
      );
    } catch (error) {
      console.warn('Error in isFileSelected:', error);
      return false;
    }
  }

  get filesWithSelectionInfo() {
    if (!this.args.directory || !this.args.directory.choices) {
      return [];
    }

    return this.args.directory.choices.map((choice, idx) => {
      const filepath = this.buildFilePath(this.args.directory.path, choice);
      const isSelected = this.isFileSelected(filepath);

      return {
        choice,
        idx,
        filepath,
        isSelected,
        canSelect: true, // Always allow selection/deselection
        isDisabled: false, // Never disabled
        labelClass: '', // No opacity changes
      };
    });
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

  @action
  toggleFileSelection(filepath: string): void {
    if (this.args.onToggleFileSelection) {
      this.args.onToggleFileSelection(filepath);
    }
  }

  @action
  preventPropagation(event: Event): void {
    event.stopPropagation();
  }
}
