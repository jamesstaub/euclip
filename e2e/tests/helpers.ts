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
