import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import NumberEntry from 'client-v2/components/ui/number-entry';
import PopupMenu, { type MenuItem } from 'client-v2/components/ui/popup-menu';
import type { ControlView } from 'client-v2/audio/runner';
import { controlWidget, type ControlEntry } from 'client-v2/controls/registry';
import { GLIDE_MAPPING } from 'client-v2/controls/modes';
import { unitMenuItems } from 'client-v2/controls/unit-menu';
import { mappingOf, numberOf } from 'client-v2/controls/view';
import intoView from 'client-v2/modifiers/into-view';
import onEscape from 'client-v2/modifiers/on-escape';
import onOutside from 'client-v2/modifiers/on-outside';
import type AudioService from 'client-v2/services/audio';
import type ViewService from 'client-v2/services/view';

export interface ControlRowSignature {
  Element: HTMLLIElement;
  Args: {
    scopeId: string;
    control: ControlView;
  };
}

/**
 * One declared control in the controls pane: its label, the widget its kind names (from the registry),
 * a readout that can be typed into, and its menu (slider mode, reset, and MIDI learn to come). The menu
 * opens from its own button, and from a long press or a right click on the widget.
 */
export default class ControlRow extends Component<ControlRowSignature> {
  @service declare audio: AudioService;
  @service declare view: ViewService;

  @tracked menuOpen = false;
  /** the box that sets the control's glide is showing (opened from the menu) */
  @tracked glideOpen = false;

  glideMapping = GLIDE_MAPPING;

  get glideText(): string {
    return GLIDE_MAPPING.format(this.args.control.glide?.seconds ?? 0);
  }

  /** Shown on the row, quietly, when the control glides: so it can be seen without opening the menu. */
  get glideMark(): string | undefined {
    const glide = this.args.control.glide;
    return glide && glide.seconds > 0 ? `glide ${this.glideText}` : undefined;
  }

  openGlide = (): void => {
    this.glideOpen = true;
  };

  closeGlide = (): void => {
    this.glideOpen = false;
  };

  /** A glide dragged or stepped in its box (a whole drag is one step to undo), or typed. */
  setGlide = (seconds: number, gesture?: string): void => {
    this.audio.setControlGlide(
      this.args.scopeId,
      this.args.control.key,
      seconds,
      gesture,
    );
  };

  commitGlide = (typed: string): boolean => {
    const seconds = GLIDE_MAPPING.parse(typed);
    if (seconds === null) return false;
    this.setGlide(seconds);
    return true;
  };

  /** The script was just closed with the cursor on this control's declaration. */
  get linked(): boolean {
    const linked = this.view.linked;
    return (
      linked !== null &&
      linked.scopeId === this.args.scopeId &&
      linked.line === this.args.control.line
    );
  }

  showInScript = (): void => {
    const line = this.args.control.line;
    if (line !== undefined) this.view.showInScript(this.args.scopeId, line);
  };

  get entry(): ControlEntry | undefined {
    return controlWidget(this.args.control.kind);
  }

  get text(): string {
    return (
      mappingOf(this.args.control)?.format(numberOf(this.args.control.value)) ??
      ''
    );
  }

  /** Where the parameter is, when code has moved it away from the control. */
  get effectiveText(): string | undefined {
    const effective = this.args.control.effective;
    if (effective === null) return undefined;
    return typeof effective === 'number'
      ? (mappingOf(this.args.control)?.format(effective) ?? String(effective))
      : effective === true
        ? 'on'
        : effective === false
          ? 'off'
          : effective;
  }

  get menuItems(): MenuItem[] {
    const { control, scopeId } = this.args;
    // the units this kind of parameter can be shown in (a parameter with only one has nothing to choose)
    const modes = unitMenuItems(control, (choice) =>
      this.audio.chooseControlMode(scopeId, control.key, choice),
    );
    // Glide: how long the parameter takes to get to where the control is put. Only where it can.
    const glide = control.glide;
    const glides: MenuItem[] = !glide
      ? []
      : glide.follows !== undefined
        ? [
            {
              label: `Glide: follows ${glide.follows} (${this.glideText})`,
              separated: modes.length > 0,
              disabled: true,
            },
          ]
        : [
            {
              label: `Glide: ${this.glideText}…`,
              separated: modes.length > 0,
              onSelect: this.openGlide,
            },
            {
              label: 'Reset glide',
              disabled: !glide.stored,
              onSelect: () =>
                this.audio.setControlGlide(scopeId, control.key, undefined),
            },
          ];
    return [
      ...modes,
      ...glides,
      {
        label: 'Reset',
        separated: modes.length > 0 || glides.length > 0,
        disabled: !control.stored,
        onSelect: () => this.audio.resetControl(scopeId, control.key),
      },
      {
        label: 'Show in script',
        disabled: control.line === undefined,
        onSelect: this.showInScript,
      },
      { label: 'Learn MIDI (coming)', disabled: true },
    ];
  }

  openMenu = (): void => {
    this.menuOpen = true;
  };

  setMenuOpen = (open: boolean): void => {
    this.menuOpen = open;
  };

  /** A typed value, read the way the control's mode reads it. False if it could not be. */
  commit = (typed: string): boolean => {
    const value = mappingOf(this.args.control)?.parse(typed);
    if (value === null || value === undefined) return false;
    this.audio.setControl(this.args.scopeId, this.args.control.key, value);
    return true;
  };

  <template>
    <li
      class="control-row control-row--{{@control.kind}}"
      data-stored={{if @control.stored "true"}}
      data-moved={{if this.effectiveText "true"}}
      data-linked={{if this.linked "true"}}
      data-waiting={{if @control.waiting "true"}}
      data-mode={{@control.mode}}
      title={{@control.waiting}}
      data-test-control={{@control.key}}
      ...attributes
      {{intoView this.linked}}
    >
      <span
        class="control-row__label truncate"
        title={{@control.label}}
      >{{@control.label}}</span>

      {{#if this.entry}}
        <this.entry.component
          class="control-row__widget"
          @scopeId={{@scopeId}}
          @control={{@control}}
          @onMenu={{this.openMenu}}
        />
        {{#if this.entry.number}}
          <NumberEntry
            class="control-row__value"
            @text={{this.text}}
            @label={{@control.label}}
            @onCommit={{this.commit}}
          />
        {{/if}}
      {{else}}
        <span class="control-row__unknown">No widget called “{{@control.kind}}”.</span>
      {{/if}}

      {{#if this.effectiveText}}
        <span
          class="control-row__effective"
          title="Where the script has moved the parameter"
          data-test-effective-text
        >now {{this.effectiveText}}</span>
      {{/if}}

      {{#if this.glideMark}}
        <span
          class="control-row__glide-mark"
          title="The parameter takes this long to get to where the control is put. Change it from the menu."
          data-test-glide-mark
        >{{this.glideMark}}</span>
      {{/if}}

      {{#if this.glideOpen}}
        <span
          class="control-row__glide"
          role="group"
          aria-label="{{@control.label}} glide"
          data-test-glide-box
          {{onOutside this.closeGlide}}
          {{onEscape this.closeGlide}}
        >
          <span class="control-row__glide-label">Glide</span>
          <NumberEntry
            class="control-row__glide-value"
            @text={{this.glideText}}
            @label="{{@control.label}} glide"
            @value={{@control.glide.seconds}}
            @mapping={{this.glideMapping}}
            @onChange={{this.setGlide}}
            @onCommit={{this.commitGlide}}
          />
          <button
            type="button"
            class="btn btn--s"
            data-test-glide-done
            {{on "click" this.closeGlide}}
          >Done</button>
        </span>
      {{/if}}

      <PopupMenu
        class="control-row__menu"
        @label="{{@control.label}} menu"
        @items={{this.menuItems}}
        @open={{this.menuOpen}}
        @onOpenChange={{this.setMenuOpen}}
      />
    </li>
  </template>
}
