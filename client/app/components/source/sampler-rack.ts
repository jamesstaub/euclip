import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import type SamplePoolService from 'euclip/services/sample-pool';
import type ProjectUiService from 'euclip/services/project-ui';
import type NotificationsService from 'euclip/services/notifications';
import type TrackModel from 'euclip/models/track';
import { assignSound, clearSound, samplerSlots, type SamplerSlot } from 'euclip/utils/sampler-files';

interface SamplerRackSignature {
  Args: {
    track: TrackModel;
    /** index into the track's source nodes */
    selectedIdx: number;
    onSelect: (index: number) => void;
    /** opens the sound browser, at a folder when given */
    onShowFilePath: (path?: string) => void;
  };
}

const normalize = (path: string) => (path.startsWith('/') ? path : `/${path}`);

/**
 * The sounds of a track's samplers, one card each: what each holds (name, a small waveform, length), a way to
 * hear it, to change it, to clear it, and to find it in the sound browser. Replaces the row of identical
 * "SAMPLER sampler1…" tabs plus a clickable path. Choosing a card selects that sampler for the controls below and
 * for the sound browser; an empty card opens the browser with that sampler as its target.
 */
export default class SourceSamplerRackComponent extends Component<SamplerRackSignature> {
  @service declare samplePool: SamplePoolService;
  @service declare projectUi: ProjectUiService;
  @service declare notifications: NotificationsService;

  get isKit(): boolean {
    return samplerSlots(this.args.track).length > 1;
  }

  get loadedCount(): number {
    return samplerSlots(this.args.track).filter((slot) => slot.path).length;
  }

  get total(): number {
    return samplerSlots(this.args.track).length;
  }

  get cards() {
    const kit = this.isKit;
    const browserOpen = this.projectUi.leftSidebarOpen;
    return samplerSlots(this.args.track).map((slot: SamplerSlot) => {
      const selected = slot.index === this.args.selectedIdx;
      const folders = slot.path.split('/').filter(Boolean).slice(0, -1);
      const title = kit ? `Sampler ${slot.number}` : 'Sampler';
      return {
        ...slot,
        title,
        selected,
        // the browser is open and this sampler is where its next sound goes
        target: browserOpen && selected,
        buffer: slot.node.sampleIsLoaded ? (slot.node.nativeNode as any)?.buffer : undefined,
        durationText: slot.node.bufferDuration ? `${slot.node.bufferDuration.toFixed(2)}s` : '',
        // the script's own name for the sampler, when it is more than the default "sampler2"
        idLabel: /^sampler\d*$/.test(slot.node.scriptId ?? '') ? '' : slot.node.scriptId,
        caption: folders.slice(-2).join(' › '),
        folder: folders.length ? `/${folders.join('/')}` : undefined,
        error: slot.node.filepathControl?.fileDownloadError,
        playing: Boolean(slot.path) && this.samplePool.playingPath === normalize(slot.path),
        label: slot.path ? `${title}: ${slot.name}` : `${title}: empty. Add a sound`,
      };
    });
  }

  @action
  select(card: { index: number }) {
    this.args.onSelect(card.index);
  }

  // an empty card, or "change": this sampler becomes the browser's target
  @action
  add(card: { index: number }) {
    this.args.onSelect(card.index);
    this.args.onShowFilePath();
  }

  @action
  showInBrowser(card: { index: number; folder?: string }) {
    this.args.onSelect(card.index);
    this.args.onShowFilePath(card.folder);
  }

  @action
  audition(card: { path: string }) {
    this.samplePool.previewPath(card.path);
  }

  @action
  async clear(card: { slot: number; path: string; title: string; name: string; index: number }) {
    const { track } = this.args;
    this.notifications.dismissGroup('undo'); // an earlier Undo is out of date now
    await clearSound(track, card.slot);
    this.notifications.push({
      type: 'info',
      group: 'undo',
      message: `${card.title} cleared`,
      actionLabel: 'Undo',
      timeout: 6000,
      action: () => {
        assignSound(track, card.slot, card.path);
      },
    });
  }
}
