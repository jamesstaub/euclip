import Component from '@glimmer/component';
import { service } from '@ember/service';
import ControlRow from 'client-v2/components/control-row';
import { OWN_GROUP, type ControlView } from 'client-v2/audio/runner';
import type AudioService from 'client-v2/services/audio';

interface Group {
  id: string;
  label: string;
  type: string;
  byPosition: boolean;
  /** declared one by one: always shown */
  explicit: ControlView[];
  /** from `controls('#node')`: under "more" */
  implicit: ControlView[];
}

export interface ControlsPaneSignature {
  Element: HTMLElement;
  Args: {
    /** a track's id, or the project scope */
    scopeId: string;
    heading: string;
  };
}

/**
 * The controls a script declares, grouped by the node each is bound to, in the order they were
 * declared. Controls with no node (`slider('density', {…})`) come first, in a group of their own.
 * Sections rather than tabs, so everything declared is on screen at once and it reads the same at
 * every width.
 */
export default class ControlsPane extends Component<ControlsPaneSignature> {
  @service declare audio: AudioService;

  get groups(): Group[] {
    const groups = new Map<string, Group>();
    for (const control of this.audio.controls(this.args.scopeId)) {
      let group = groups.get(control.group.id);
      if (!group) {
        group = { ...control.group, explicit: [], implicit: [] };
        groups.set(control.group.id, group);
      }
      (control.implicit ? group.implicit : group.explicit).push(control);
    }
    const own = groups.get(OWN_GROUP);
    return [
      ...(own ? [own] : []),
      ...[...groups.values()].filter((group) => group.id !== OWN_GROUP),
    ];
  }

  <template>
    <section
      class="footer-pane controls-pane"
      aria-label={{@heading}}
      data-test-pane="controls"
      ...attributes
    >
      <h3 class="pane-heading">{{@heading}}</h3>
      {{#each this.groups key="id" as |group|}}
        <section class="control-group" data-test-control-group={{group.id}}>
          <h4 class="control-group__title">
            <b>{{group.label}}</b>
            {{#if group.type}}<span>{{group.type}}</span>{{/if}}
            {{#if group.byPosition}}
              <span
                title="This node has no id in the script: it is found by its position"
                data-test-by-position
              >by position</span>
            {{/if}}
          </h4>
          {{#if group.explicit.length}}
            <ul class="control-list">
              {{#each group.explicit key="key" as |control|}}
                <ControlRow @scopeId={{@scopeId}} @control={{control}} />
              {{/each}}
            </ul>
          {{/if}}
          {{#if group.implicit.length}}
            <details class="control-more" data-test-control-more>
              <summary>More ({{group.implicit.length}})</summary>
              <ul class="control-list">
                {{#each group.implicit key="key" as |control|}}
                  <ControlRow @scopeId={{@scopeId}} @control={{control}} />
                {{/each}}
              </ul>
            </details>
          {{/if}}
        </section>
      {{else}}
        <p class="pane-empty" data-test-pane-empty>This script declares no
          controls. A control appears here for each line like
          <code>slider('#filter', 'frequency')</code>,
          <code>knob('#level', 'gain')</code>
          or
          <code>toggle('#sampler', 'loop')</code>
          in the script (press Script), and
          <code>controls('#filter')</code>
          declares one for every parameter of a node.</p>
      {{/each}}
    </section>
  </template>
}
