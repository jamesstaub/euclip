import Component from '@glimmer/component';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import ControlRow from 'client-v2/components/control-row';
import Hint from 'client-v2/components/ui/hint';
import {
  OWN_GROUP,
  type ControlGroup,
  type ControlView,
} from 'client-v2/audio/runner';
import type AudioService from 'client-v2/services/audio';
import type ViewService from 'client-v2/services/view';

interface Section extends ControlGroup {
  controls: ControlView[];
}

/** The sections of one chain of the script (or of one bus), in the order the signal passes through. */
interface Chain {
  key: string;
  /** what to call it, when the script has more than one: `chain 2`, `drums bus` */
  title: string | null;
  bus: string | null;
  sections: Section[];
}

/** What "no id" means, said once where it shows. */
const NO_ID =
  "This node has no id in the script, so its stored values follow its position in the script. Give it one to keep them when the chain changes: .lowpass({ id: 'filter' })";

export interface ControlsPaneSignature {
  Element: HTMLElement;
  Args: {
    /** a track's id, or the project scope */
    scopeId: string;
    heading: string;
  };
}

/**
 * The controls a script declares, a section per node.
 *
 * A section is headed by what the node is (its type: LOWPASS), then the id the script gave it if it gave
 * one. An automatic id is never shown: two nodes of a type with no ids are told apart by number, in the
 * order of the script (LOWPASS 1, LOWPASS 2), and marked "no id". Sections follow the script's chain,
 * not the order the controls were declared in; separate chains are separate blocks, and a bus is a
 * block of its own with its level first and then its inserts. Controls with no node
 * (`slider('density', {…})`) come first.
 *
 * Sections rather than tabs, so it reads the same at every width; each can be closed, and which are
 * closed is remembered on this device (it is not part of the project).
 */
export default class ControlsPane extends Component<ControlsPaneSignature> {
  @service declare audio: AudioService;
  @service declare view: ViewService;

  get chains(): Chain[] {
    const chains = new Map<number, Chain>();
    const sections = new Map<string, Section>();
    for (const control of this.audio.controls(this.args.scopeId)) {
      let section = sections.get(control.group.id);
      if (!section) {
        section = { ...control.group, controls: [] };
        sections.set(section.id, section);
        let chain = chains.get(section.chain);
        if (!chain) {
          chain = {
            key: String(section.chain),
            title: null,
            bus: null,
            sections: [],
          };
          chains.set(section.chain, chain);
        }
        chain.bus ??= section.bus;
        chain.sections.push(section);
      }
      section.controls.push(control);
    }
    const list = [...chains.values()];
    // (the script's own controls are not a chain; a lone chain needs no name)
    const plain = list.filter(
      (chain) => chain.bus === null && chain.sections[0]?.id !== OWN_GROUP,
    );
    for (const chain of list) {
      chain.title =
        chain.bus !== null
          ? `${chain.bus} bus`
          : plain.length > 1 && plain.includes(chain)
            ? `chain ${plain.indexOf(chain) + 1}`
            : null;
    }
    return list;
  }

  isOpen = (section: Section): boolean =>
    this.view.isSectionOpen(this.args.scopeId, section.id);

  /** The person opened or closed a section (the browser has already done it on screen). */
  toggled = (section: Section, event: Event): void =>
    this.view.setSectionOpen(
      this.args.scopeId,
      section.id,
      (event.target as HTMLDetailsElement).open,
    );

  <template>
    <section
      class="footer-pane controls-pane"
      aria-label={{@heading}}
      data-test-pane="controls"
      ...attributes
    >
      <h3 class="pane-heading">
        <span>{{@heading}}</span>
        <Hint @label="About controls" data-test-controls-hint>
          <p>A control is here because the script declares it. One line gives
            every node its controls, placed after the chain:
            <code>controls()</code>. Or one at a time, for a parameter of a
            node:
            <code>slider('#filter', 'frequency')</code>,
            <code>knob('#level', 'gain')</code>,
            <code>toggle('#sampler', 'loop')</code>. Press Script to write them.</p>
          <p>The number in the script is the default; what you set here is kept
            in the project. A control’s menu (⋮) changes its unit, resets it,
            and shows its line in the script.</p>
          <p><b>no id</b>: the node has no id in the script, so its values
            follow its position in the script. Give it one to keep them when the
            chain changes:
            <code>.lowpass(\{ id: 'filter' })</code></p>
        </Hint>
      </h3>
      {{#each this.chains key="key" as |chain|}}
        <div
          class="control-chain {{if chain.title 'control-chain--named'}}"
          data-test-control-chain={{chain.key}}
          data-bus={{chain.bus}}
        >
          {{#if chain.title}}
            <h4
              class="control-chain__title"
              data-test-chain-title
            >{{chain.title}}</h4>
          {{/if}}
          {{#each chain.sections key="id" as |section|}}
            <details
              class="control-group"
              open={{this.isOpen section}}
              aria-label={{section.label}}
              data-test-control-group={{section.id}}
              {{on "toggle" (fn this.toggled section)}}
            >
              <summary class="control-group__title">
                <b data-test-group-type>{{if
                    section.type
                    section.type
                    section.label
                  }}{{#if section.ordinal}} {{section.ordinal}}{{/if}}</b>
                {{#if section.name}}
                  <span
                    class="control-group__id"
                    data-test-group-id
                  >{{section.name}}</span>
                {{/if}}
                {{#if section.byPosition}}
                  <span
                    class="control-group__hint"
                    title={{NO_ID}}
                    data-test-by-position
                  >no id</span>
                {{else if (isSeveral section)}}
                  <span class="control-group__hint">{{section.count}}
                    nodes together</span>
                {{/if}}
              </summary>
              <ul class="control-list">
                {{#each section.controls key="key" as |control|}}
                  <ControlRow @scopeId={{@scopeId}} @control={{control}} />
                {{/each}}
              </ul>
            </details>
          {{/each}}
        </div>
      {{else}}
        <p class="pane-empty" data-test-pane-empty>This script declares no
          controls.</p>
      {{/each}}
    </section>
  </template>
}

function isSeveral(section: Section): boolean {
  return section.count > 1;
}
