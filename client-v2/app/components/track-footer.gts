import Component from '@glimmer/component';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import ChannelStrip from 'client-v2/components/channel-strip';
import CodeEditor from 'client-v2/components/code-editor';
import Icon, { type IconName } from 'client-v2/components/icon';
import SequencePane from 'client-v2/components/sequence-pane';
import type { ScriptError } from 'client-v2/audio/runner';
import { PROJECT_SCOPE, type TrackDocument } from 'client-v2/project/schema';
import type AudioService from 'client-v2/services/audio';
import type ViewService from 'client-v2/services/view';
import type { FooterPane } from 'client-v2/services/view';

const BODY_ID = 'track-footer-body';

// v1's three views of a track.
const TABS: readonly { pane: FooterPane; icon: IconName; large?: boolean }[] = [
  { pane: 'sequence', icon: 'squares' },
  { pane: 'source', icon: 'sound' },
  { pane: 'controls', icon: 'automation', large: true },
];

function is(a: string, b: string): boolean {
  return a === b;
}

export interface TrackFooterSignature {
  Element: HTMLElement;
  Args: {
    /** the selected track, or null for the main output */
    track: TrackDocument | null;
    /** the selected track's place in the list, counted from 1 */
    order: number;
    /** the script the footer shows: the track's own, or for the main output the project script */
    script: string;
    onScriptChange: (value: string) => void;
  };
}

/**
 * Footer region: the selected track's detail. Its bar names the track and holds two controls: the script
 * button, which swaps the whole footer between its UI and the track's script, and the collapse control.
 * A script that has an error says so here, under the bar, until it runs cleanly again.
 *
 * The UI is the channel strip and a menu of sequence (the script's named sequences, derived from what
 * is running), source and controls. Those last two, and the main output's, are empty states for now:
 * how a script declares a control is being redesigned. This is the only place a script is shown.
 */
export default class TrackFooter extends Component<TrackFooterSignature> {
  @service declare audio: AudioService;
  @service declare view: ViewService;

  get scopeId(): string {
    return this.args.track?.id ?? PROJECT_SCOPE;
  }

  get name(): string {
    return this.args.track ? `Track ${this.args.order}` : 'Main output';
  }

  get scriptLabel(): string {
    return this.args.track ? `${this.name} script` : 'Project script';
  }

  get error(): ScriptError | null {
    return this.audio.error(this.scopeId);
  }

  isChosen = (pane: FooterPane): 'true' | 'false' =>
    this.view.footerPane === pane ? 'true' : 'false';

  choosePane = (pane: FooterPane): void => this.view.setFooterPane(pane);
  toggleScript = (): void => this.view.toggleScript();
  toggle = (): void => this.view.toggleFooter();

  <template>
    <footer
      class="track-footer"
      aria-label="Selected track"
      data-open={{if this.view.footerOpen "true" "false"}}
      data-shows={{if this.view.scriptOpen "script" "ui"}}
      data-error={{if this.error "true"}}
      data-test-track-footer
      ...attributes
    >
      <div class="track-footer__bar">
        <h2 class="track-footer__title truncate" data-test-footer-title>
          <b>{{this.name}}</b>
          <span>{{if @track @track.name "Project"}}</span>
        </h2>

        <button
          type="button"
          class="btn btn--s btn--on-yellow track-footer__script-btn"
          aria-label={{this.scriptLabel}}
          aria-pressed={{if this.view.scriptOpen "true" "false"}}
          data-test-script-toggle
          {{on "click" this.toggleScript}}
        >
          <Icon @name="code" />
          <span class="track-footer__btn-label">Script</span>
          {{#if this.error}}
            <span class="track-footer__alert" aria-hidden="true">!</span>
          {{/if}}
        </button>

        <button
          type="button"
          class="btn btn--s btn--ghost btn--on-yellow track-footer__collapse"
          aria-label={{if this.view.footerOpen "Collapse" "Expand"}}
          aria-expanded={{if this.view.footerOpen "true" "false"}}
          aria-controls={{BODY_ID}}
          data-test-footer-toggle
          {{on "click" this.toggle}}
        >
          <span class="track-footer__btn-label">{{if
              this.view.footerOpen
              "Hide"
              "Show"
            }}</span>
          <Icon
            @name="play"
            class="icon--s {{if this.view.footerOpen 'icon--down' 'icon--up'}}"
          />
        </button>
      </div>

      {{#if this.error}}
        <p class="track-footer__error" role="alert" data-test-script-error>
          <b>{{if
              this.error.sequence
              "Sequence stopped"
              "Still running the last version that worked"
            }}{{#if this.error.sequence}} ({{this.error.sequence}}){{/if}}.</b>
          {{this.error.message}}
        </p>
      {{/if}}

      {{#if this.view.footerOpen}}
        {{#if this.view.scriptOpen}}
          <div
            class="track-footer__body track-footer__body--script"
            id={{BODY_ID}}
            data-test-footer-body
            data-test-footer-script
          >
            <CodeEditor
              class="code-editor--fill"
              @doc={{@script}}
              @onChange={{@onScriptChange}}
              @label={{this.scriptLabel}}
              @error={{this.error}}
            />
          </div>
        {{else if @track}}
          <div
            class="track-footer__body"
            id={{BODY_ID}}
            data-test-footer-body
            data-test-footer-ui
          >
            <ChannelStrip class="track-footer__strip" @track={{@track}} />

            <div class="footer-tabs" role="group" aria-label="Show">
              {{#each TABS as |tab|}}
                <button
                  type="button"
                  class="footer-tab"
                  aria-pressed={{this.isChosen tab.pane}}
                  data-test-footer-tab={{tab.pane}}
                  {{on "click" (fn this.choosePane tab.pane)}}
                >
                  <Icon @name={{tab.icon}} class={{if tab.large "icon--l"}} />
                  <span>{{tab.pane}}</span>
                </button>
              {{/each}}
            </div>

            <div class="track-footer__pane scroll-y scroll--on-yellow">
              {{#if (is this.view.footerPane "sequence")}}
                <SequencePane @scopeId={{this.scopeId}} @label={{this.name}} />
              {{else if (is this.view.footerPane "source")}}
                <section
                  class="footer-pane"
                  aria-label="{{this.name}} source"
                  data-test-pane="source"
                >
                  <h3 class="pane-heading">Source</h3>
                  <p class="pane-empty" data-test-pane-empty>Controls for the
                    track's source are coming. A control will appear here where
                    the script declares one; until then, values are set in the
                    script.</p>
                </section>
              {{else}}
                <section
                  class="footer-pane"
                  aria-label="{{this.name}} controls"
                  data-test-pane="controls"
                >
                  <h3 class="pane-heading">Audio node controls</h3>
                  <p class="pane-empty" data-test-pane-empty>Controls are
                    coming. A slider or toggle will appear here where the script
                    declares one; until then, values are set in the script.</p>
                </section>
              {{/if}}
            </div>
          </div>
        {{else}}
          <div
            class="track-footer__body track-footer__body--master"
            id={{BODY_ID}}
            data-test-footer-body
            data-test-footer-ui
          >
            <div class="track-footer__pane scroll-y scroll--on-yellow">
              <section
                class="footer-pane"
                aria-label="Main output"
                data-test-pane="master"
              >
                <h3 class="pane-heading">Main output</h3>
                <p class="pane-empty" data-test-pane-empty>Every track's
                  <code>out</code>
                  arrives at the main bus. Its inserts and level are set in the
                  project script (press Script); controls for them are coming.</p>
              </section>
            </div>
          </div>
        {{/if}}
      {{/if}}
    </footer>
  </template>
}
