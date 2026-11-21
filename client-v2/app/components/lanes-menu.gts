import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import PopupMenu, { type MenuItem } from 'client-v2/components/ui/popup-menu';
import {
  rowLanes,
  sequenceLanes,
  type SequenceLanes,
} from 'client-v2/components/row-lanes';
import type AudioService from 'client-v2/services/audio';
import type ViewService from 'client-v2/services/view';

export interface LanesMenuSignature {
  Element: HTMLDivElement;
  Args: {
    scopeId: string;
    /** the menu's accessible name */
    label: string;
    /** Only this sequence's lanes, and not its grid (the sequence pane's card). Absent: every grid and lane (the track's row). */
    sequence?: string;
    /** opens over the page upward (a track row near the footer) */
    up?: boolean;
  };
}

/**
 * The Lanes menu: what the track shows under its grids, as checkbox items that leave the menu open.
 * Every slider, knob and toggle on a parameter has a lane; one in play (some step holds a value of its
 * own) is shown unless hidden, and says how many steps. The same choice as each control's lane button
 * and each lane's Hide lane (services/view.ts).
 */
export default class LanesMenu extends Component<LanesMenuSignature> {
  @service declare audio: AudioService;
  @service declare view: ViewService;

  @tracked open = false;

  setOpen = (open: boolean): void => {
    this.open = open;
  };

  get all(): SequenceLanes[] {
    return sequenceLanes(this.audio, this.args.scopeId);
  }

  get sequences(): SequenceLanes[] {
    const only = this.args.sequence;
    return only === undefined
      ? this.all
      : this.all.filter(({ grid }) => grid.name === only);
  }

  get shown(): Set<string> {
    return this.view.shownLanes(this.args.scopeId, rowLanes(this.all));
  }

  get keys(): string[] {
    const grids = this.args.sequence === undefined;
    return this.sequences.flatMap(({ grid, lanes }) => [
      ...(grids ? [grid.key] : []),
      ...lanes.map((lane) => lane.key),
    ]);
  }

  get text(): string {
    const shown = this.shown;
    const keys = this.keys;
    return `Lanes ${keys.filter((key) => shown.has(key)).length}/${keys.length}`;
  }

  get items(): MenuItem[] {
    const shown = this.shown;
    const scopeId = this.args.scopeId;
    const grids = this.args.sequence === undefined;
    const many = grids && this.sequences.length > 1;
    const toggle = (
      key: string,
      label: string,
      id: string,
      hint?: string,
    ): MenuItem => ({
      id,
      label,
      toggle: true,
      checked: shown.has(key),
      ...(hint === undefined ? {} : { hint }),
      onSelect: () => this.view.setLane(scopeId, key, !shown.has(key)),
    });
    return this.sequences.flatMap(({ grid, lanes }, index) => [
      ...(many
        ? [
            {
              id: `heading:${grid.key}`,
              label: grid.name,
              heading: true,
              separated: index > 0,
            } satisfies MenuItem,
          ]
        : []),
      ...(grids ? [toggle(grid.key, grid.name, `grid:${grid.key}`)] : []),
      ...lanes.map((lane) => {
        const locked = lane.locked.filter(Boolean).length;
        return toggle(
          lane.key,
          lane.label,
          `lane:${lane.key}`,
          locked > 0
            ? `${locked} step${locked === 1 ? '' : 's'} set`
            : undefined,
        );
      }),
    ]);
  }

  <template>
    {{#if this.items.length}}
      <PopupMenu
        class="lanes-menu"
        @label={{@label}}
        @text={{this.text}}
        @items={{this.items}}
        @open={{this.open}}
        @onOpenChange={{this.setOpen}}
        @up={{@up}}
        data-test-lanes-menu
        ...attributes
      />
    {{/if}}
  </template>
}
