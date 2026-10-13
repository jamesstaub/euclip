import Component from '@glimmer/component';
import { samplerSlots } from 'euclip/utils/sampler-files';
import type TrackModel from 'euclip/models/track';
import type { AudioSelectMode } from 'euclip/components/project/ui-state';

interface TargetCardSignature {
  Args: {
    track?: TrackModel;
    mode: AudioSelectMode;
    /** index into the track's source nodes (what the project UI state holds) */
    selectedIdx: number;
    onSelectSampler: (index: number) => void;
    onNewTracks: () => void;
  };
}

/**
 * Says where the next sound will go and lets that change without leaving the list:
 * "Track 2 · kit → Sampler 3", with a chip per sampler (what each holds, at a glance), or "New tracks".
 */
export default class SoundsTargetCardComponent extends Component<TargetCardSignature> {
  get slots() {
    return samplerSlots(this.args.track);
  }

  get isNewTracks(): boolean {
    return this.args.mode === 'create_tracks';
  }

  get current() {
    return this.slots.find((slot) => slot.index === this.args.selectedIdx) ?? this.slots[0];
  }

  get isKit(): boolean {
    return this.slots.length > 1;
  }

  // the samplers of the track are only the target when sounds go to the track, not to new tracks
  get showChips(): boolean {
    return this.isKit && !this.isNewTracks;
  }

  get chips() {
    const current = this.current;
    return this.slots.map((slot) => ({ ...slot, selected: !this.isNewTracks && slot.index === current?.index }));
  }

  get menuItems() {
    const order = this.args.track?.order;
    const items = this.slots.map((slot) => ({
      label: this.isKit ? `Track ${order} · Sampler ${slot.number}` : `Track ${order} · Sampler`,
      select: () => this.args.onSelectSampler(slot.index),
    }));
    items.push({ label: 'New tracks', select: () => this.args.onNewTracks() });
    return items;
  }
}
