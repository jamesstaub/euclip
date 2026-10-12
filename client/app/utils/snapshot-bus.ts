declare const cracked: any;

/**
 * One output bus (a gain node feeding the speakers) per snapshot. Everything a snapshot's scripts send
 * to `dac()` goes through its bus, so a snapshot can be built in the background with its bus closed
 * (silent), then switched in by opening its bus and closing the old one.
 */
const buses = new Map<string, GainNode>();

function context(): AudioContext {
  return cracked.getContext();
}

/** The bus for a snapshot, created closed (gain 0) unless asked to start open. */
export function busFor(snapshotId: string, { open = false }: { open?: boolean } = {}): GainNode {
  let bus = buses.get(snapshotId);
  if (bus && open && bus.gain.value < 1) {
    bus.gain.value = 1; // e.g. a snapshot that was staged (closed) and has since become the active one
  }
  if (!bus) {
    const ctx = context();
    bus = ctx.createGain();
    bus.gain.value = open ? 1 : 0;
    bus.connect(ctx.destination);
    buses.set(snapshotId, bus);
  }
  return bus;
}

/** Runs `build` with cracked's destination (dac/out) pointing at the snapshot's bus. */
export function withSnapshotDestination<T>(snapshotId: string, build: () => T, options?: { open?: boolean }): T {
  cracked.setDestination(busFor(snapshotId, options));
  try {
    return build();
  } finally {
    cracked.setDestination(null); // never leave later builds routed to a bus
  }
}

/** Ramps a snapshot's bus to `level` (0..1) over a few milliseconds, avoiding clicks. */
export function fadeBus(snapshotId: string, level: number, seconds = 0.015): void {
  const bus = buses.get(snapshotId);
  if (!bus) return;
  const now = context().currentTime;
  bus.gain.cancelScheduledValues(now);
  bus.gain.setValueAtTime(bus.gain.value, now);
  bus.gain.linearRampToValueAtTime(level, now + seconds);
}

export function hasBus(snapshotId: string): boolean {
  return buses.has(snapshotId);
}

export function removeBus(snapshotId: string): void {
  const bus = buses.get(snapshotId);
  if (bus) {
    try {
      bus.disconnect();
    } catch (_) {
      /* already disconnected */
    }
    buses.delete(snapshotId);
  }
}
