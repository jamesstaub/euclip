import { test } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { createProject, login } from './helpers';

// Report, not a gate: exercises the main flows and lists every unique Ember/Ember Data deprecation.
//   E2E_DEPRECATIONS=1 npx playwright test deprecations
test.skip(!process.env.E2E_DEPRECATIONS, 'set E2E_DEPRECATIONS=1 to run');

test('collect deprecations', async ({ page }) => {
  const seen = new Map<string, { count: number; text: string }>();
  page.on('console', (m) => {
    const t = m.text();
    if (!/DEPRECATION/.test(t)) return;
    const id = /\[deprecation id: ([^\]]+)\]/.exec(t)?.[1] ?? t.slice(0, 80);
    const prev = seen.get(id);
    seen.set(id, { count: (prev?.count ?? 0) + 1, text: prev?.text ?? t.replace(/\s+/g, ' ').slice(0, 400) });
  });

  await login(page);
  await createProject(page);
  await page.getByRole('button', { name: 'New Track' }).click();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'play' }).click();
  await page.waitForTimeout(1500);
  const tryClick = (name: string | RegExp) => page.getByRole('button', { name }).first().click({ timeout: 4000 }).catch(() => {});
  await tryClick('scripts'); // script sidebar
  await page.waitForTimeout(1500);
  await tryClick(/audio file browser|pick a sound/i); // file picker
  await page.waitForTimeout(2000);
  await tryClick('stop');
  await page.goto('/');
  await page.waitForTimeout(1500);

  const rows = [...seen.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.count - a.count);
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/deprecations.json', JSON.stringify(rows, null, 2));
  for (const r of rows) console.log(`${String(r.count).padStart(4)}x ${r.id}\n       ${r.text.slice(0, 230)}`);
  console.log(`\n${rows.length} unique deprecations`);
});
