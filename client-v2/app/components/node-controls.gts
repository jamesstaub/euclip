import type { TOC } from '@ember/component/template-only';
import ParamRows, {
  type ParamPlaceholder,
} from 'client-v2/components/param-rows';

// Placeholder content: a sampler into a lowpass filter, with the filter's tab chosen.
const NODES = ['sampler', 'lowpass', 'gain'] as const;
const SELECTED_NODE = 'lowpass';

const PARAMS: readonly ParamPlaceholder[] = [
  { name: 'frequency', min: 20, max: 20000, value: 2000, unit: 'Hz' },
  { name: 'q', min: 0, max: 20, value: 6 },
  { name: 'gain', min: 0, max: 1, value: 0.8 },
  { name: 'pan', min: -1, max: 1, value: 0 },
];

function isSelected(node: string): 'true' | 'false' {
  return node === SELECTED_NODE ? 'true' : 'false';
}

export interface NodeControlsSignature {
  Element: HTMLElement;
  Args: {
    /** the track's name, for the accessible name */
    label: string;
  };
}

/** The "controls" pane: the track's nodes as tabs and a row per parameter of the chosen node. Static placeholders. */
const NodeControls: TOC<NodeControlsSignature> = <template>
  <section
    class="footer-pane"
    aria-label="{{@label}} controls"
    data-test-pane="controls"
    ...attributes
  >
    <h3 class="pane-heading">Audio node controls</h3>
    <div class="pane-tabs scroll-x scroll--on-yellow">
      {{#each NODES as |node|}}
        <button
          type="button"
          class="pane-tab truncate"
          aria-pressed={{isSelected node}}
        >{{node}}</button>
      {{/each}}
    </div>
    <ParamRows @params={{PARAMS}} />
  </section>
</template>;

export default NodeControls;
