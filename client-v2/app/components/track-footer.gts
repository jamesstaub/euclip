import Component from '@glimmer/component';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import ChannelStrip from 'client-v2/components/channel-strip';
import CodeEditor from 'client-v2/components/code-editor';
import Icon, { type IconName } from 'client-v2/components/icon';
import MasterControls from 'client-v2/components/master-controls';
import NodeControls from 'client-v2/components/node-controls';
import SequencePane from 'client-v2/components/sequence-pane';
import SourcePane from 'client-v2/components/source-pane';
import type ViewService from 'client-v2/services/view';
import type { FooterPane } from 'client-v2/services/view';
import {
  trackName,
  type TrackPlaceholder,
} from 'client-v2/utils/placeholder-tracks';

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
    /** the selected track (or the main output) */
    track: TrackPlaceholder;
    /** the script the footer shows for it: the track's own, or for the main output the project script */
    script: string;
    onScriptChange: (value: string) => void;
  };
}

/**
 * Footer region: the selected track's detail. Its bar names the track and holds two controls: the script
 * button, which swaps the whole footer between its UI and the track's script, and the collapse control.
 *
 * The UI is v1's footer (channel strip, the sequence / source / controls menu, the chosen pane); for the
 * main output it is the master controls, and its script is the project script. This is the only place a
 * script is shown. Layout is in styles/track-footer.css.
 */
export default class TrackFooter extends Component<TrackFooterSignature> {
  @service declare view: ViewService;

  get scriptLabel(): string {
    return this.args.track.output
      ? 'Project script'
      : `${trackName(this.args.track)} script`;
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
      data-test-track-footer
      ...attributes
    >
      <div class="track-footer__bar">
        <h2 class="track-footer__title truncate" data-test-footer-title>
          <b>{{trackName @track}}</b>
          {{#if @track.output}}
            <span>Project</span>
          {{else}}
            <span>{{@track.source}}</span>
          {{/if}}
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
            />
          </div>
        {{else if @track.output}}
          <div
            class="track-footer__body track-footer__body--master"
            id={{BODY_ID}}
            data-test-footer-body
            data-test-footer-ui
          >
            <div class="track-footer__pane scroll-y scroll--on-yellow">
              <MasterControls />
            </div>
          </div>
        {{else}}
          <div
            class="track-footer__body"
            id={{BODY_ID}}
            data-test-footer-body
            data-test-footer-ui
          >
            <ChannelStrip class="track-footer__strip" />

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
                <SequencePane @label={{trackName @track}} />
              {{else if (is this.view.footerPane "source")}}
                <SourcePane
                  @label={{trackName @track}}
                  @source={{@track.source}}
                />
              {{else}}
                <NodeControls @label={{trackName @track}} />
              {{/if}}
            </div>
          </div>
        {{/if}}
      {{/if}}
    </footer>
  </template>
}
