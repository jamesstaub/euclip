import { expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Dev seed user (server/db/seeds.rb). Override with E2E_USER / E2E_PASSWORD.
function seedCredentials() {
  const seeds = readFileSync(resolve(__dirname, '../../server/db/seeds.rb'), 'utf8');
  const block = seeds.split('username: "james"')[1] ?? '';
  const password = /password:\s*"([^"]+)"/.exec(block)?.[1];
  return { user: 'james', password };
}

export function credentials() {
  const seed = seedCredentials();
  return {
    user: process.env.E2E_USER || seed.user,
    password: process.env.E2E_PASSWORD || seed.password || '',
  };
}

export async function login(page: Page) {
  const { user, password } = credentials();
  await page.goto('/login');
  await page.getByLabel('Username').fill(user);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /log in/i }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** Opens /new, which creates an untitled project and lands on it. */
export async function createProject(page: Page) {
  await page.goto('/new');
  await expect(page.getByRole('button', { name: 'New Track' })).toBeVisible();
}

/** Number of live cracked audio nodes matching a selector (cracked is a page global). */
export function audioNodeCount(page: Page, selector: string) {
  return page.evaluate((s) => (window as any).__(s).size(), selector);
}

/** The ember-simple-auth JWT, for calling the API directly from a test. */
export async function apiHeaders(page: Page) {
  const session = await page.evaluate(() => JSON.parse(localStorage.getItem('ember_simple_auth-session') || '{}'));
  return { Authorization: session.authenticated.token as string, Accept: 'application/json', 'Content-Type': 'application/json' };
}

/** Sets a track's (first) sequence through the API, e.g. { steps: 32, hits: 4 }. Reload the page afterwards. */
export async function setSequence(page: Page, track: { id: string; sequenceId: string }, attributes: Record<string, number>) {
  const res = await page.request.patch(`/v1/sequences/${track.sequenceId}`, {
    headers: await apiHeaders(page),
    data: { data: { type: 'sequences', id: track.sequenceId, attributes, relationships: { track: { data: { type: 'tracks', id: track.id } } } } },
  });
  expect(res.ok()).toBe(true);
}

/** Creates a project via /new and returns its first regular track (ids from the API payload). */
export async function createProjectWithTrack(page: Page) {
  const created = page.waitForResponse((r) => r.request().method() === 'POST' && /\/v1\/projects\?/.test(r.url()));
  await createProject(page);
  const body = await (await created).json();
  const track = body.included.find((i: any) => i.type === 'track' && !i.attributes['is-master']);
  return {
    projectId: body.data.id as string,
    macrosScriptId: body.included.find((i: any) => i.type === 'macros-script')?.id as string | undefined,
    id: track.id as string,
    sequenceId: track.relationships.sequences.data[0].id as string,
    initScriptId: track.relationships['init-script'].data.id as string,
    onstepScriptId: track.relationships['onstep-script'].data.id as string,
  };
}

type TrackIds = Awaited<ReturnType<typeof createProjectWithTrack>>;

/** Replaces a track's setup ("init") or play ("onstep") script through the API. Reload the page afterwards. */
export async function setScript(page: Page, track: TrackIds, kind: 'init' | 'onstep', code: string) {
  const id = kind === 'init' ? track.initScriptId : track.onstepScriptId;
  const res = await page.request.patch(`/v1/${kind}-scripts/${id}`, {
    headers: await apiHeaders(page),
    data: { data: { type: `${kind}-scripts`, id, attributes: { code, 'editor-content': code }, relationships: { track: { data: { type: 'tracks', id: track.id } } } } },
  });
  expect(res.ok()).toBe(true);
}

/** Replaces the project-wide macros script through the API. Reload the page afterwards. */
export async function setMacrosScript(page: Page, project: { projectId: string; macrosScriptId?: string }, code: string) {
  const id = project.macrosScriptId!;
  const res = await page.request.patch(`/v1/macros-scripts/${id}`, {
    headers: await apiHeaders(page),
    data: { data: { type: 'macros-scripts', id, attributes: { code, 'editor-content': code }, relationships: { project: { data: { type: 'projects', id: project.projectId } } } } },
  });
  expect(res.ok()).toBe(true);
}

/** Adds a sequence to a track through the API (it is ordered after the existing ones). */
export async function addSequence(page: Page, track: TrackIds, attributes: Record<string, number>) {
  const res = await page.request.post('/v1/sequences', {
    headers: await apiHeaders(page),
    data: { data: { type: 'sequences', attributes, relationships: { track: { data: { type: 'tracks', id: track.id } } } } },
  });
  expect(res.ok()).toBe(true);
  return (await res.json()).data.id as string;
}

/** Stores a sample file for one sampler slot of a track through the API. */
export async function addFilepath(page: Page, track: TrackIds, slot: number, controlValue: string) {
  const res = await page.request.post('/v1/filepath-controls', {
    headers: await apiHeaders(page),
    data: { data: { type: 'filepath-controls', attributes: { 'control-value': controlValue, 'node-order': slot }, relationships: { track: { data: { type: 'tracks', id: track.id } } } } },
  });
  expect(res.ok()).toBe(true);
}

/**
 * Records every value cracked schedules on an audio param, keyed by the param's default value
 * (oscillator frequency 440, biquad filter frequency 350, ...). A headless audio context never
 * renders, so reading `.value` back doesn't move; what was scheduled is what the audio would get.
 * Call before the page loads.
 */
export async function spyOnParams(page: Page) {
  await page.addInitScript(() => {
    const w = window as any;
    w.__scheduled = {};
    const original = AudioParam.prototype.setValueAtTime;
    AudioParam.prototype.setValueAtTime = function (value: number, time: number) {
      (w.__scheduled[this.defaultValue] ??= []).push(Math.round(value * 100) / 100);
      return original.call(this, value, time);
    };
  });
}

export const scheduledOn = (page: Page, paramDefault: number): Promise<number[]> =>
  page.evaluate((d) => (window as any).__scheduled?.[d] ?? [], paramDefault);

/**
 * Records the linear ramps cracked schedules (an ADSR envelope is a series of them on a gain param):
 * `{ param, value }` with a number identifying which AudioParam it was. Call before the page loads.
 */
export async function spyOnRamps(page: Page) {
  await page.addInitScript(() => {
    const w = window as any;
    w.__ramps = [];
    const ids = new WeakMap<object, number>();
    const original = AudioParam.prototype.linearRampToValueAtTime;
    AudioParam.prototype.linearRampToValueAtTime = function (value: number, time: number) {
      if (!ids.has(this)) ids.set(this, ids.size + 1);
      w.__ramps.push({ param: ids.get(this), value: Math.round(value * 1000) / 1000 });
      return original.call(this, value, time);
    };
  });
}

export const rampsSeen = (page: Page): Promise<{ param: number; value: number }[]> =>
  page.evaluate(() => (window as any).__ramps ?? []);

/**
 * Counts oscillators that have been started. An OscillatorNode makes no sound until `start()` is called, so a
 * track whose oscillator never starts is silent no matter how its envelope and gains are set.
 * Call before the page loads.
 */
export async function spyOnOscillatorStarts(page: Page) {
  await page.addInitScript(() => {
    const w = window as any;
    w.__oscStarts = 0;
    const original = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (...args: [number?]) {
      w.__oscStarts += 1;
      return original.apply(this, args);
    };
  });
}

export const oscillatorStarts = (page: Page): Promise<number> => page.evaluate(() => (window as any).__oscStarts ?? 0);

/**
 * Records every value set on a sampler's loopStart (cracked's `start` attribute): the offset a sample
 * plays from. Not an AudioParam, so it is watched on the node itself. Call before the page loads.
 */
export async function spyOnLoopStarts(page: Page) {
  await page.addInitScript(() => {
    const w = window as any;
    w.__loopStarts = [];
    const descriptor = Object.getOwnPropertyDescriptor(AudioBufferSourceNode.prototype, 'loopStart')!;
    Object.defineProperty(AudioBufferSourceNode.prototype, 'loopStart', {
      ...descriptor,
      set(value: number) {
        w.__loopStarts.push(Math.round(value * 1000) / 1000);
        descriptor.set!.call(this, value);
      },
    });
  });
}

export const loopStartsSeen = (page: Page): Promise<number[]> => page.evaluate(() => (window as any).__loopStarts ?? []);

/**
 * Records connections from a sampler (an AudioBufferSourceNode) to a gain, by the nodes' cracked uuids:
 * `{ from, to }`. Call before the page loads.
 */
export async function spyOnSamplerConnections(page: Page) {
  await page.addInitScript(() => {
    const w = window as any;
    w.__connections = [];
    const original = AudioNode.prototype.connect as any;
    (AudioNode.prototype as any).connect = function (destination: any, ...rest: any[]) {
      if (this instanceof AudioBufferSourceNode && destination instanceof GainNode) {
        w.__connections.push({ from: (this as any).uuid, to: destination.uuid });
      }
      return original.call(this, destination, ...rest);
    };
  });
}

export const samplerConnections = (page: Page): Promise<{ from: string; to: string }[]> =>
  page.evaluate(() => (window as any).__connections ?? []);
