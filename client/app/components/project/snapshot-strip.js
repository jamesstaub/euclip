import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import byKey from 'euclip/utils/by-key';

/**
 * A row of the project's snapshots: click to switch (on the next step while playing), "+" saves the
 * current state as a new snapshot, double-click renames, x deletes (not the active one).
 */
export default class ProjectSnapshotStripComponent extends Component {
  @service snapshotRuntime;
  @tracked renamingId = null;

  get items() {
    const runtime = this.snapshotRuntime;
    return this.args.project.snapshots
      .slice()
      .sort(byKey('position'))
      .map((snapshot) => ({
        snapshot,
        active: snapshot.isActive,
        pending: runtime.pendingSnapshot === snapshot,
        state: snapshot.isActive ? 'active' : 'idle',
      }));
  }

  get canDelete() {
    return this.args.project.snapshots.length > 1;
  }

  @action
  startRename(snapshot) {
    this.renamingId = snapshot.id;
  }

  @action
  focusInput(element) {
    element.focus();
    element.select();
  }

  @action
  onRenameKey(snapshot, event) {
    if (event.key === 'Enter') {
      this.commitRename(snapshot, event);
    } else if (event.key === 'Escape') {
      this.renamingId = null;
    }
  }

  @action
  commitRename(snapshot, event) {
    if (this.renamingId !== snapshot.id) return;
    this.renamingId = null;
    this.args.onRename?.(snapshot, event.target.value);
  }
}
