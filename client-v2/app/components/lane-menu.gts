import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import PopupMenu, { type MenuItem } from 'client-v2/components/ui/popup-menu';
import type { LaneView } from 'client-v2/audio/runner';
import { GLIDE_MAPPING } from 'client-v2/controls/modes';
import { glideBlockedItems, unitMenuItems } from 'client-v2/controls/unit-menu';
import type AudioService from 'client-v2/services/audio';
import type ViewService from 'client-v2/services/view';

export interface LaneMenuSignature {
  Element: HTMLDivElement;
  Args: {
    scopeId: string;
    lane: LaneView;
    /** hides the lane (wherever the track draws it) */
    onHide?: () => void;
  };
}

/**
 * A lane's own menu, at the end of its head: the control's menu (the shared unit and glide items,
 * Reset, Show in script) and, for the lane, the sequence it follows (where there is a choice), Clear
 * all steps and Hide lane.
 */
export default class LaneMenu extends Component<LaneMenuSignature> {
  @service declare audio: AudioService;
  @service declare view: ViewService;

  @tracked open = false;

  setOpen = (open: boolean): void => {
    this.open = open;
  };

  get items(): MenuItem[] {
    const { lane, scopeId, onHide } = this.args;
    const control = lane.control;
    const units = unitMenuItems(control, (choice) =>
      this.audio.chooseControlMode(scopeId, control.key, choice),
    );
    // (the sequences with a grid it could follow, where there is more than one)
    const sequences = control.lane?.sequences ?? [];
    const follows: MenuItem[] =
      sequences.length > 1
        ? sequences.map((name, index) => ({
            id: `follow:${name}`,
            label: `Steps of ${name}`,
            checked: name === control.lane?.sequence,
            separated: index === 0,
            onSelect: () =>
              this.audio.setLaneSequence(scopeId, control.key, name),
          }))
        : [];
    const glide = control.glide;
    // (the time itself is set in the control's own menu, which has the box for it)
    const glides: MenuItem[] = !glide
      ? glideBlockedItems(control, units.length > 0)
      : [
          {
            id: 'glide',
            label:
              glide.follows !== undefined
                ? `Glide: follows ${glide.follows} (${GLIDE_MAPPING.format(glide.seconds)})`
                : `Glide: ${GLIDE_MAPPING.format(glide.seconds)}…`,
            hint: 'Set in the control’s menu',
            separated: units.length > 0,
            disabled: true,
          },
          ...(glide.follows === undefined
            ? [
                {
                  id: 'reset-glide',
                  label: 'Reset glide',
                  disabled: !glide.stored,
                  onSelect: () =>
                    this.audio.setControlGlide(scopeId, control.key, undefined),
                },
              ]
            : []),
        ];
    return [
      ...units,
      ...glides,
      {
        label: 'Reset',
        separated: units.length > 0 || glides.length > 0,
        disabled: !control.stored,
        onSelect: () => this.audio.resetControl(scopeId, control.key),
      },
      {
        label: 'Show in script',
        disabled: control.line === undefined,
        onSelect: () => {
          if (control.line !== undefined) {
            this.view.showInScript(scopeId, control.line);
          }
        },
      },
      { label: 'Learn MIDI (coming)', disabled: true },
      ...follows,
      {
        id: 'reset-lane',
        label: 'Clear all steps',
        separated: true,
        disabled: !lane.active,
        onSelect: () => this.audio.resetLane(scopeId, control.key),
      },
      ...(onHide
        ? [{ id: 'hide-lane', label: 'Hide lane', onSelect: onHide }]
        : []),
    ];
  }

  <template>
    <PopupMenu
      class="lane__menu"
      @label="{{@lane.label}} lane menu"
      @items={{this.items}}
      @open={{this.open}}
      @onOpenChange={{this.setOpen}}
      @up={{true}}
      @avoid=".track-footer"
      data-test-lane-menu={{@lane.key}}
      ...attributes
    />
  </template>
}
