import type { TOC } from '@ember/component/template-only';
import ParamRows, {
  type ParamPlaceholder,
} from 'client-v2/components/param-rows';

// Placeholder content: the one control the main output is sure to have.
const PARAMS: readonly ParamPlaceholder[] = [
  { name: 'level', min: 0, max: 1, value: 0.8 },
];

export interface MasterControlsSignature {
  Element: HTMLElement;
}

/** The footer UI of the main output: master controls. A static placeholder (a level fader; no metering). */
const MasterControls: TOC<MasterControlsSignature> = <template>
  <section
    class="footer-pane"
    aria-label="Main output controls"
    data-test-pane="master"
    ...attributes
  >
    <h3 class="pane-heading">Main output</h3>
    <ParamRows @params={{PARAMS}} />
  </section>
</template>;

export default MasterControls;
