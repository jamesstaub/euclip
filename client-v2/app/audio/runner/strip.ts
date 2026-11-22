/**
 * A track's channel strip: the `out` bus and the pan insert Euclip makes in its host scope, and putting
 * level, pan, mute and solo on them.
 */

import type { Scope } from 'cracked-up';
import { HOST_TAG } from 'client-v2/controls/declarations';
import { type TrackDocument } from 'client-v2/project/schema';
import { FOLLOW, HOST_PAN_ID, OUT_BUS } from 'client-v2/audio/runner/types';
import type { RunnerContext } from 'client-v2/audio/runner/context';

export class ChannelStrip {
  readonly ctx: RunnerContext;

  constructor(ctx: RunnerContext) {
    this.ctx = ctx;
  }

  /**
   * Makes a track's way out in its host scope: there (and silent) even when the script has never built.
   * Its pan is tagged as the host's, so that nothing a script declares can reach it.
   */
  make(host: Scope, track: TrackDocument): void {
    host
      .bus(OUT_BUS)
      .to('main')
      .insert()
      .panner({
        id: HOST_PAN_ID,
        pan: track.pan,
        tags: { [HOST_TAG]: 'host' },
      });
    host.bus(OUT_BUS).gain.set(track.level * this.audible(track));
  }

  /**
   * A track's channel strip: its `out` bus and the pan insert on it. They are in the track's host scope,
   * the parent of the scope its script builds in. A script reaches it by name (`.to('channel')` looks
   * outward through parent scopes) but its selectors, which look inward, never find the pan; and its
   * rebuilds, which only reconcile their own scope, never touch either.
   */
  /**
   * 1 when the track is heard, 0 when it is muted or another track is soloed and this one is not. It
   * multiplies the strip's level at the channel's gain: the stored level is never changed by it.
   */
  audible(track: TrackDocument): number {
    const anySolo = this.ctx.host.getDoc().tracks.some((other) => other.solo);
    return track.mute || (anySolo && !track.solo) ? 0 : 1;
  }

  applyStrip(track: TrackDocument, moved = false): void {
    const runtime = this.ctx.scopes.get(track.id);
    if (!runtime) return;
    // A fader being moved sends a value on every movement: each is glided to, from wherever the level
    // has got to, so the sound has no steps in it. As a track is made there is nothing to glide from.
    const how = moved ? FOLLOW : undefined;
    const out = runtime.host.bus(OUT_BUS);
    out.gain.set(track.level * this.audible(track), how);
    [...out.inserts]
      .find((node) => node.id === HOST_PAN_ID)
      ?.param('pan')
      .set(track.pan, how);
  }
}
