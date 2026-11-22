/**
 * What the runner's parts share: the engine, the host, the scopes' records and the flags and timers that
 * more than one part touches, and the parts themselves (so one can ask another).
 */

import type { Engine } from 'cracked-up';
import {
  type RunnerHost,
  type ScopeRuntime,
} from 'client-v2/audio/runner/types';
import type { ControlViews } from 'client-v2/audio/runner/controls';
import type { Editors } from 'client-v2/audio/runner/editors';
import type { Lanes } from 'client-v2/audio/runner/lanes';
import type { SequenceSync } from 'client-v2/audio/runner/sync';
import type { ChannelStrip } from 'client-v2/audio/runner/strip';
import type { SoundLibrary } from 'client-v2/audio/runner/sounds';

export interface RunnerParts {
  views: ControlViews;
  editors: Editors;
  lanes: Lanes;
  sync: SequenceSync;
  strip: ChannelStrip;
  sounds: SoundLibrary;
}

export interface RunnerContext {
  readonly engine: Engine;
  readonly host: RunnerHost;
  readonly scopes: Map<string, ScopeRuntime>;
  readonly realtime: boolean;
  readonly timers: Set<ReturnType<typeof setTimeout>>;
  /** a control is being applied: the parameter changes that follow are the user's own move */
  applying: boolean;
  readonly parts: RunnerParts;
}
