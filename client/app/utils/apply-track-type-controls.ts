import type TrackModel from 'euclip/models/track';
import type { TrackTypeInfo } from 'euclip/services/track-types';

/**
 * Applies a track type's control defaults to a freshly built track, e.g. a looped sampler's speed
 * control uses "Loop Sync" units. Keys are "nodeType.attr"; only meant for new tracks, because
 * switching a control's unit resets its value.
 */
export default function applyTrackTypeControls(track: TrackModel, controls: TrackTypeInfo['controls']): void {
  Object.entries(controls).forEach(([key, settings]) => {
    const [nodeType, attr] = key.split('.');
    const control = track.trackControls.find(
      (c: any) => !c.isDeleted && c.nodeType === nodeType && c.nodeAttr === attr
    ) as any;
    if (!control) {
      console.warn(`Track type control ${key} not found on track ${track.id}`);
      return;
    }

    if (settings.unit) {
      const index = control.paramUnitNames.indexOf(settings.unit);
      if (index >= 0) {
        control.setParamUnit({ index, value: settings.unit });
      } else {
        console.warn(`Unit "${settings.unit}" is not available for ${key}`);
      }
    }
  });
}
