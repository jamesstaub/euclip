import { test, expect } from '@playwright/test';

// The style guide is the UI library on one page: every atom on both surfaces. It needs no login.
test.describe('ui library', () => {
  test('renders every atom on both surfaces without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto('/styleguide');
    await expect(page.getByRole('heading', { name: 'UI library' })).toBeVisible();
    for (const surface of ['On dark', 'On yellow']) {
      const section = page.locator('section', { has: page.getByRole('heading', { name: surface }) });
      await expect(section.getByRole('button', { name: 'outline', exact: true })).toBeVisible();
      await expect(section.getByRole('button', { name: 'pressed' })).toHaveAttribute('aria-pressed', 'true');
      await expect(section.getByRole('group', { name: 'Example' }).getByRole('button')).toHaveCount(2);
    }
    expect(errors).toEqual([]);
  });

  test('there is one yellow: text, borders and backgrounds agree', async ({ page }) => {
    await page.goto('/styleguide');
    const colours = await page.evaluate(() => {
      const probe = (cls: string, prop: string) => {
        const el = document.createElement('div');
        el.className = cls;
        el.style.borderStyle = 'solid';
        document.body.appendChild(el);
        const value = getComputedStyle(el).getPropertyValue(prop);
        el.remove();
        return value;
      };
      return { text: probe('yellow', 'color'), border: probe('b--yellow', 'border-top-color'), background: probe('bg-yellow', 'background-color') };
    });
    expect(colours.text).toBe(colours.background);
    expect(colours.border).toBe(colours.background);
  });

  test('every element inherits the sans-serif base font', async ({ page }) => {
    await page.goto('/styleguide');
    const families = await page.evaluate(() =>
      ['div', 'section', 'aside', 'p', 'button', 'input'].map((tag) => {
        const el = document.createElement(tag);
        document.body.appendChild(el);
        const family = getComputedStyle(el).fontFamily;
        el.remove();
        return [tag, family];
      })
    );
    for (const [tag, family] of families) expect(family, tag).toMatch(/sans-serif/);
  });
});
