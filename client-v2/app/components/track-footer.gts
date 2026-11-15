import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import ChannelStrip from 'client-v2/components/channel-strip';
import CodeEditor from 'client-v2/components/code-editor';
import ControlsPane from 'client-v2/components/controls-pane';
import Icon, { type IconName } from 'client-v2/components/icon';
import SequencePane from 'client-v2/components/sequence-pane';
import SourcePane from 'client-v2/components/source-pane';
import type { ScriptError } from 'client-v2/audio/runner';
import type { LineProblem } from 'client-v2/modifiers/mount-editor';
import type { DeclarationWarning } from 'client-v2/controls/declarations';
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
 * A script that has an error (or a declaration that cannot work) says so in a strip laid over the bottom
 * of the footer, which moves nothing, until it runs cleanly again.
 *
 * The UI is the channel strip and a menu of sequence (the sequencers the script declares), source (the
 * waveform editors it declares) and controls (the controls the script declares, by node). For the main output it
 * is the project script's controls. This is the only place a script is shown.
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

  get warnings(): DeclarationWarning[] {
    return this.audio.warnings(this.scopeId);
  }

  /** The warnings that have a line, for the editor to underline there. */
  get problems(): LineProblem[] {
    return this.warnings.flatMap((warning) =>
      warning.line === undefined
        ? []
        : [
            {
              line: warning.line,
              message: warning.message,
              severity: 'warning' as const,
            },
          ],
    );
  }

  /** A line a control has asked the editor to show, when it is of this script. */
  get reveal(): { line: number; token: number } | null {
    const reveal = this.view.reveal;
    return reveal?.scopeId === this.scopeId ? reveal : null;
  }

  noteCursor = (line: number): void => this.view.noteCursor(this.scopeId, line);

  get hasStatus(): boolean {
    return this.error !== null || this.warnings.length > 0;
  }

  /** The whole of a long message is shown, instead of one line of it. */
  @tracked statusOpen = false;

  toggleStatus = (): void => {
    this.statusOpen = !this.statusOpen;
  };

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
      data-warnings={{if this.warnings.length "true"}}
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
              @problems={{this.problems}}
              @reveal={{this.reveal}}
              @onCursor={{this.noteCursor}}
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
                <SourcePane @scopeId={{this.scopeId}} @label={{this.name}} />
              {{else}}
                <ControlsPane @scopeId={{this.scopeId}} @heading="Controls" />
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
              <ControlsPane
                @scopeId={{this.scopeId}}
                @heading="Main output"
                data-test-pane="master"
              />
            </div>
          </div>
        {{/if}}
      {{/if}}

      {{! Errors and warnings are laid over the bottom of the footer: they never move what is above. }}
      {{#if this.hasStatus}}
        {{#if this.view.footerOpen}}
          <div
            class="track-footer__status {{if this.statusOpen 'is-open'}}"
            data-test-footer-status
          >
            {{#if this.error}}
              <p
                class="track-footer__error"
                role="alert"
                title={{this.error.message}}
                data-test-script-error
              >
                <b>{{if
                    this.error.sequence
                    "Sequence stopped"
                    "Still running the last version that worked"
                  }}{{#if this.error.sequence}}
                    ({{this.error.sequence}}){{/if}}.</b>
                {{this.error.message}}
              </p>
            {{/if}}
            {{#if this.warnings.length}}
              <ul
                class="track-footer__warnings"
                role="status"
                data-test-script-warnings
              >
                {{#each this.warnings as |warning|}}
                  <li title={{warning.message}}>
                    {{#if warning.line}}<b>Line {{warning.line}}.</b>{{/if}}
                    {{warning.message}}
                  </li>
                {{/each}}
              </ul>
            {{/if}}
            <button
              type="button"
              class="btn btn--s btn--ghost track-footer__status-more"
              aria-expanded={{if this.statusOpen "true" "false"}}
              aria-label={{if
                this.statusOpen
                "Show less of the message"
                "Show the whole message"
              }}
              data-test-status-toggle
              {{on "click" this.toggleStatus}}
            >{{if this.statusOpen "Less" "More"}}</button>
          </div>
        {{/if}}
      {{/if}}
    </footer>
  </template>
}
