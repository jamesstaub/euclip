import { test } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';

// Report: runs the legacy Ember QUnit suite (served by ember serve at /tests) and lists failures.
//   E2E_QUNIT=1 npx playwright test qunit
test.skip(!process.env.E2E_QUNIT, 'set E2E_QUNIT=1 to run');
test.setTimeout(240_000);

test('run legacy qunit suite', async ({ page }) => {
  await page.goto('/tests?hidepassed&nocontainer');
  await page.waitForFunction(() => /Tests completed in/i.test(document.querySelector('#qunit-testresult')?.textContent ?? ''), null, { timeout: 200_000 });
  const summary = (await page.locator('#qunit-testresult').innerText()).replace(/\s+/g, ' ');
  const failed = await page.locator('#qunit-tests > li.fail').evaluateAll((els) =>
    els.map((li) => ({
      module: li.querySelector('.module-name')?.textContent?.trim(),
      name: li.querySelector('.test-name')?.textContent?.trim(),
      message: (li.querySelector('.fail .test-message') ?? li.querySelector('.test-message'))?.textContent?.trim().slice(0, 160),
    })),
  );
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/qunit.json', JSON.stringify({ summary, failed }, null, 2));
  console.log(summary);
  const byModule = new Map<string, number>();
  for (const f of failed) byModule.set(f.module ?? '?', (byModule.get(f.module ?? '?') ?? 0) + 1);
  for (const [m, n] of byModule) console.log(`${String(n).padStart(3)} failing  ${m}`);
});
