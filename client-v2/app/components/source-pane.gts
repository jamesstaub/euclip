import type { TOC } from '@ember/component/template-only';
import ParamRows, {
  type ParamPlaceholder,
} from 'client-v2/components/param-rows';

// Placeholder content, after v1's source pane for a sampler: its card, then the sampler's parameters.
const PARAMS: readonly ParamPlaceholder[] = [
  { name: 'speed', min: -2, max: 2, value: 1 },
  { name: 'start', min: 0, max: 1, value: 0, unit: 's' },
  { name: 'end', min: 0, max: 1, value: 0.42, unit: 's' },
];

export interface SourcePaneSignature {
  Element: HTMLElement;
  Args: {
    /** the track's name, for the accessible name */
    label: string;
    /** what the track plays, e.g. a sample's file name */
    source: string;
  };
}

/** The "source" pane: what the track plays. Static placeholders; the waveform is a labelled empty box. */
const SourcePane: TOC<SourcePaneSignature> = <template>
  <section
    class="footer-pane"
    aria-label="{{@label}} source"
    data-test-pane="source"
    ...attributes
  >
    <h3 class="pane-heading">Source</h3>
    <div class="sampler-card" data-test-sampler-card>
      <p class="sampler-card__head">
        <b class="truncate">{{@source}}</b>
        <span>Sampler</span>
      </p>
      <p class="sampler-card__wave">Waveform (placeholder)</p>
      <p class="sampler-card__foot">
        <button
          type="button"
          class="btn btn--ghost btn--s"
          aria-label="Audition {{@source}}"
        >▶</button>
        <span>0.42 s</span>
      </p>
    </div>
    <ParamRows @params={{PARAMS}} />
  </section>
</template>;

export default SourcePane;
