import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import type SamplePoolService from 'euclip/services/sample-pool';
import type { DirectoryModel } from 'euclip/models/audio-file-tree';
import { soundName } from 'euclip/utils/sampler-files';

interface SoundsListSignature {
  Args: {
    directory?: DirectoryModel;
    /** where each sound already lives on the target track: path -> "Sampler 2" */
    badges?: Record<string, string>;
    showCheck?: boolean;
    selectedPaths?: string[];
    onOpenFolder: (directory: DirectoryModel, name: string) => void;
    onUp: () => void;
    onUse: (path: string) => void;
    onToggle: (path: string) => void;
  };
}

const join = (dir: string, name: string) => (dir.endsWith('/') ? `${dir}${name}` : `${dir}/${name}`);

const durationText = (seconds?: number) => (seconds == null ? '' : `${seconds.toFixed(2)}s`);

/**
 * The folder the browser is in, as one column of rows. Moving through it with the arrow keys auditions each sound
 * (→ opens a folder, ← goes up, Enter uses a sound, Space plays or stops it), and clicking a sound does the same.
 * Nothing is active until the user picks something: an unset selection must not light up the first row.
 */
export default class SoundsListComponent extends Component<SoundsListSignature> {
  @service declare samplePool: SamplePoolService;

  @tracked private active: { dir: string; name: string } | null = null;

  get dirPath(): string {
    return this.args.directory?.path ?? '/';
  }

  /** the active row's name, if it belongs to the folder being shown */
  get activeName(): string | null {
    return this.active && this.active.dir === this.dirPath ? this.active.name : null;
  }

  get isFolderList(): boolean {
    return this.args.directory?.type === 'dir';
  }

  get rows() {
    const directory = this.args.directory;
    if (!directory) return [];
    const folder = directory.type === 'dir';
    const picked = new Set(this.args.selectedPaths ?? []);
    return directory.choices.map((name, index) => {
      const path = join(directory.path, name);
      const key = path.startsWith('/') ? path : `/${path}`;
      return {
        id: `sound-row-${index}`,
        raw: name, // the entry as the folder lists it; `name` is what is shown (a sound without its extension)
        name: folder ? name : soundName(name),
        path,
        folder,
        selected: name === this.activeName,
        playing: !folder && this.samplePool.playingPath === key,
        loading: !folder && this.samplePool.loadingPath === key,
        detail: folder ? '' : durationText(this.samplePool.durationOf(path)),
        badge: this.args.badges?.[path],
        checked: picked.has(path),
      };
    });
  }

  get activeId(): string | undefined {
    return this.rows.find((row) => row.selected)?.id;
  }

  private activate(name: string) {
    this.active = { dir: this.dirPath, name };
  }

  @action
  open(row: { raw: string; folder: boolean }) {
    this.activate(row.raw);
    this.args.onOpenFolder(this.args.directory!, row.raw);
  }

  /** a click, or an arrow key arriving on a sound: select it and let the user hear it */
  @action
  select(row: { raw: string; path: string; folder: boolean }) {
    this.activate(row.raw);
    if (!row.folder) this.samplePool.previewPath(row.path);
  }

  @action
  play(row: { raw: string; path: string }) {
    this.activate(row.raw);
    this.samplePool.previewPath(row.path);
  }

  @action
  use(row: { path: string }) {
    this.args.onUse(row.path);
  }

  @action
  toggle(row: { path: string }) {
    this.args.onToggle(row.path);
  }

  @action
  onKeydown(event: KeyboardEvent) {
    const rows = this.rows;
    if (!rows.length || event.altKey || event.metaKey || event.ctrlKey) return;
    const index = rows.findIndex((row) => row.selected);
    const current = index === -1 ? undefined : rows[index];

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        const next = rows[Math.min(rows.length - 1, Math.max(0, index === -1 ? (step > 0 ? 0 : rows.length - 1) : index + step))];
        this.select(next);
        break;
      }
      case 'ArrowRight':
        if (current?.folder) {
          event.preventDefault();
          this.open(current);
        }
        break;
      case 'ArrowLeft':
      case 'Backspace':
        event.preventDefault();
        this.args.onUp();
        break;
      case 'Enter':
        if (!current) return;
        event.preventDefault();
        if (current.folder) this.open(current);
        else this.use(current);
        break;
      case ' ':
        if (current && !current.folder) {
          event.preventDefault();
          this.play(current);
        }
        break;
      default:
    }
  }
}
