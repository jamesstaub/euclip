import type { TOC } from '@ember/component/template-only';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import ChannelStrip from 'client-v2/components/channel-strip';
import CodeEditor from 'client-v2/components/code-editor';
import ControlsPane from 'client-v2/components/controls-pane';
import Icon, { type IconName } from 'client-v2/components/icon';
import onEscape from 'client-v2/modifiers/on-escape';
import SequencePane from 'client-v2/components/sequence-pane';
import SourcePane from 'client-v2/components/source-pane';
import type { ScriptError } from 'client-v2/audio/runner';
import type { LineProblem } from 'client-v2/modifiers/mount-editor';
import type { DeclarationWarning } from 'client-v2/controls/declarations';
import { PROJECT_SCOPE, type TrackDocument } from 'client-v2/project/schema';
import type AudioService from 'client-v2/services/audio';
import type ProjectService from 'client-v2/services/project';
import type ViewService from 'client-v2/services/view';
import type { FooterPane } from 'client-v2/services/view';

const BODY_ID = 'track-footer-body';

// v1's three views of a track.
const TABS: readonly { pane: FooterPane; icon: IconName; large?: boolean }[] = [
  { pane: 'source', icon: 'sound' },
  { pane: 'controls', icon: 'automation', large: true },
  { pane: 'sequence', icon: 'squares' },
];

/** What a tab is called on screen (the controls pane is the processors tab: source has controls too). */
function labelOf(pane: FooterPane): string {
  return pane === 'controls' ? 'processors' : pane;
}

function is(a: string, b: string): boolean {
  return a === b;
}

interface TabsSignature {
  Args: {
    isChosen: (pane: FooterPane) => 'true' | 'false';
    onChoose: (pane: FooterPane) => void;
  };
}

/** The menu of the footer's three views: in the body of the footer, or in the phone sheet's bar. */
const Tabs: TOC<TabsSignature> = <template>
  <div class="footer-tabs" role="group" aria-label="Show">
    {{#each TABS as |tab|}}
      <button
        type="button"
        class="footer-tab"
        aria-pressed={{@isChosen tab.pane}}
        data-test-footer-tab={{tab.pane}}
        {{on "click" (fn @onChoose tab.pane)}}
      >
        <Icon @name={{tab.icon}} class={{if tab.large "icon--l"}} />
        <span>{{labelOf tab.pane}}</span>
      </button>
    {{/each}}
  </div>
</template>;

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
 * The UI is the channel strip and a menu of sequence (the step grids the script declares), source (the
 * waveform editors it declares) and controls (the controls the script declares, by node). For the main output it
 * is the project script's controls. This is the only place a script is shown.
 */
export default class TrackFooter extends Component<TrackFooterSignature> {
  @service declare audio: AudioService;
  @service declare view: ViewService;
  @service declare project: ProjectService;

  get scopeId(): string {
    return this.args.track?.id ?? PROJECT_SCOPE;
  }

  get name(): string {
    return this.args.track ? `Track ${this.args.order}` : 'Main output';
  }

  /** What the name field shows greyed when the track has no name of its own: what it is called instead. */
  get autoName(): string {
    const track = this.args.track;
    return track
      ? (this.audio.autoTrackName(track.id) ?? `Track ${this.args.order}`)
      : '';
  }

  /** The name field is left: its text is the track's name; emptied, the track is called after its sound. */
  commitName = (event: Event): void => {
    const track = this.args.track;
    const field = event.target as HTMLInputElement;
    if (!track) return;
    const name = field.value.trim();
    field.value = name;
    if (name !== track.name) {
      this.project.apply({ type: 'renameTrack', id: track.id, name });
    }
  };

  onNameKey = (event: KeyboardEvent): void => {
    const field = event.target as HTMLInputElement;
    if (event.key === 'Enter') {
      event.preventDefault();
      field.blur();
    } else if (event.key === 'Escape') {
      // put back what it was; the sheet stays open
      event.stopPropagation();
      field.value = this.args.track?.name ?? '';
      field.blur();
    }
  };

  get scriptLabel(): string {
    return this.args.track ? `${this.name} script` : 'Project script';
  }

  /** The Script button's name; it says so when the script has an error, which nothing else shows. */
  get scriptButtonLabel(): string {
    return this.error
      ? `${this.scriptLabel}: Script has an error`
      : this.scriptLabel;
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

  /** The strip is for the script's own view; closed, an error is only a mark on the Script button. */
  get showStatus(): boolean {
    return this.view.footerOpen && this.view.scriptOpen;
  }

  /** The whole of a long message is shown, instead of one line of it. */
  @tracked statusOpen = false;

  toggleStatus = (): void => {
    this.statusOpen = !this.statusOpen;
  };

  /** On the phone a tab is pressed only while the sheet is open on it (and not on the script). */
  isChosen = (pane: FooterPane): 'true' | 'false' =>
    this.view.footerPane === pane &&
    (!this.view.phone || (this.view.footerOpen && !this.view.scriptOpen))
      ? 'true'
      : 'false';

  /** A tab: on the phone it also opens and closes the sheet (see ViewService.tapTab). */
  choosePane = (pane: FooterPane): void => {
    if (this.view.phone) this.view.tapTab(pane);
    else this.view.setFooterPane(pane);
  };
  toggleScript = (): void => this.view.toggleScript();
  toggle = (): void => this.view.toggleFooter();
  cycle = (): void => this.view.cycleSheet();

  get handleLabel(): string {
    return this.view.footerOpen && this.view.sheetSize === 'full'
      ? 'Shrink the track panel'
      : 'Expand the track panel';
  }

  /** Escape closes the phone's sheet. */
  closeSheet = (event: KeyboardEvent): void => {
    if (!this.view.phone || !this.view.footerOpen) return;
    // what has an Escape of its own keeps it: the editors, text boxes, menus (native and popup)
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest(
        'input, textarea, select, .app-shell__sidebar, [contenteditable="true"], .cm-editor, [role="menu"], [role="dialog"], dialog, button[aria-expanded="true"]:not(.track-footer__handle)',
      )
    ) {
      return;
    }
    this.view.footerOpen = false;
  };

  <template>
    <footer
      class="track-footer"
      aria-label="Selected track"
      data-open={{if this.view.footerOpen "true" "false"}}
      data-shows={{if this.view.scriptOpen "script" "ui"}}
      data-error={{if this.error "true"}}
      data-warnings={{if this.warnings.length "true"}}
      data-test-track-footer
      {{onEscape this.closeSheet}}
      ...attributes
    >
      <div class="track-footer__bar">
        <h2 class="track-footer__title truncate" data-test-footer-title>
          <b>{{this.name}}</b>
          {{#if @track}}
            <input
              type="text"
              class="track-footer__name"
              aria-label="Name of {{this.name}}"
              placeholder={{this.autoName}}
              value={{@track.name}}
              autocomplete="off"
              spellcheck="false"
              data-test-footer-name
              {{on "change" this.commitName}}
              {{on "keydown" this.onNameKey}}
            />
          {{else}}
            <span>Project</span>
          {{/if}}
        </h2>

        {{#if this.view.phone}}
          {{! the sheet's handle: its top edge, between the name and the buttons }}
          <button
            type="button"
            class="track-footer__handle"
            aria-label={{this.handleLabel}}
            aria-expanded={{if
              this.view.footerOpen
              (if (is this.view.sheetSize "full") "true" "false")
              "false"
            }}
            aria-controls={{BODY_ID}}
            data-test-sheet-handle
            {{on "click" this.cycle}}
          >
            <Icon
              @name="play"
              class="icon--s
                {{if
                  (if this.view.footerOpen (is this.view.sheetSize 'full'))
                  'icon--down'
                  'icon--up'
                }}"
            />
          </button>
        {{/if}}

        <button
          type="button"
          class="btn btn--s btn--on-yellow track-footer__script-btn"
          aria-label={{this.scriptButtonLabel}}
          aria-pressed={{if this.view.scriptOpen "true" "false"}}
          data-test-script-toggle
          {{on "click" this.toggleScript}}
        >
          <Icon @name="code" />
          <span class="track-footer__btn-label">Script</span>
          {{#if this.error}}
            <span
              class="track-footer__alert"
              title="Script has an error"
              data-test-script-alert
              aria-hidden="true"
            >!</span>
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

        {{#if this.view.phone}}
          {{#if @track}}
            <Tabs @isChosen={{this.isChosen}} @onChoose={{this.choosePane}} />
          {{/if}}
        {{/if}}
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

            {{#unless this.view.phone}}
              <Tabs @isChosen={{this.isChosen}} @onChoose={{this.choosePane}} />
            {{/unless}}

            <div class="track-footer__pane scroll-y scroll--on-yellow">
              {{#if (is this.view.footerPane "sequence")}}
                <SequencePane @scopeId={{this.scopeId}} @label={{this.name}} />
              {{else if (is this.view.footerPane "source")}}
                <SourcePane @scopeId={{this.scopeId}} @label={{this.name}} />
              {{else}}
                <ControlsPane @scopeId={{this.scopeId}} @heading="Processors" />
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
        {{#if this.showStatus}}
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
