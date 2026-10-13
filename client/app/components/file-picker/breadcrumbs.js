import Component from '@glimmer/component';
import { action } from '@ember/object';

/**
 * Where the file browser is, as a path you can click: "All sounds / Korg / Korg 01W". The first item
 * always goes back to the root, from any depth (the columns below can be scrolled out of sight).
 */
export default class FilePickerBreadcrumbsComponent extends Component {
  get items() {
    const tree = this.args.audioFileTree?.directoryTree ?? [];
    const path = tree[tree.length - 1]?.path ?? '/';
    const names = path.split('/').filter(Boolean);
    return [
      { label: 'All sounds', path: '/', current: names.length === 0 },
      ...names.map((name, index) => ({
        label: name,
        path: `/${names.slice(0, index + 1).join('/')}`,
        current: index === names.length - 1,
      })),
    ];
  }

  get atRoot() {
    return this.items.length <= 1;
  }

  @action
  go(item) {
    if (item.current) return;
    this.args.audioFileTree?.appendDirectoriesData(item.path);
  }
}
