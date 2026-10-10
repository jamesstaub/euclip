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
