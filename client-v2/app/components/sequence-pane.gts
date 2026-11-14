import type { TOC } from '@ember/component/template-only';
import ParamRows, {
  type ParamPlaceholder,
} from 'client-v2/components/param-rows';

// Placeholder content, after v1's sequencer pane: the kind of pattern, then that kind's parameters.
const KINDS = ['euclidean', 'on / off', 'binary'] as const;
const SELECTED_KIND = 'euclidean';

const PARAMS: readonly ParamPlaceholder[] = [
  { name: 'hits', min: 0, max: 16, value: 4, whole: true },
  { name: 'steps', min: 0, max: 64, value: 16, whole: true },
  { name: 'offset', min: 0, max: 64, value: 0, whole: true },
];

function isSelected(kind: string): 'true' | 'false' {
  return kind === SELECTED_KIND ? 'true' : 'false';
}

export interface SequencePaneSignature {
  Element: HTMLElement;
  Args: {
    /** the track's name, for the accessible name */
    label: string;
  };
}

/** The "sequence" pane: how the track's step pattern is made. Static placeholders. */
const SequencePane: TOC<SequencePaneSignature> = <template>
  <section
    class="footer-pane"
    aria-label="{{@label}} sequence"
    data-test-pane="sequence"
    ...attributes
  >
    <h3 class="pane-heading">Sequencer</h3>
    <div
      class="pane-tabs scroll-x scroll--on-yellow"
      role="group"
      aria-label="Sequencer type"
    >
      {{#each KINDS as |kind|}}
        <button
          type="button"
          class="pane-tab truncate"
          aria-pressed={{isSelected kind}}
        >{{kind}}</button>
      {{/each}}
    </div>
    <ParamRows @params={{PARAMS}} />
  </section>
</template>;

export default SequencePane;
