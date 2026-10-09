import { test, expect } from '@playwright/test';

test('home provides a genuine anime discovery page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
});

test('desktop navigation opens Manga and Music via real links', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await nav.getByRole('link', { name: 'Manga', exact: true }).click();
  await expect(page).toHaveURL(/\/manga\/?$/);
  await expect(page.getByRole('heading', { name: 'Manga', exact: true })).toBeVisible();
  await nav.getByRole('link', { name: 'Music', exact: true }).click();
  await expect(page).toHaveURL(/\/music\/?$/);
  await expect(page.getByRole('heading', { name: 'Anime Music', exact: true })).toBeVisible();
});

test('catalogue only shows honest empty states on blank development database', async ({ page }) => {
  await page.goto('/manga');
  await expect(page.getByText('No published manga yet')).toBeVisible();
  await page.goto('/music');
  await expect(page.getByText('No published tracks yet')).toBeVisible();
});

test('anonymous visitor cannot read private synopsis review queue', async ({ page }) => {
  await page.route('**/graphql', async (route) => {
    const request = route.request();
    const payload = request.postDataJSON();

    if (typeof payload?.query === 'string' &&
        /\bme\s*\{/.test(payload.query)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: null,
          errors: [{
            message: 'Authentication required.',
            extensions: { code: 'UNAUTHENTICATED' }
          }]
        })
      });
      return;
    }

    await route.continue();
  });

  await page.goto('/admin/catalog/review');
  await expect(
    page.getByRole('alert').filter({
      hasText: /Administrator access required/i
    })
  ).toBeVisible();
  await expect(page.getByText('Private synopsis review queue')).toHaveCount(0);
});

test('mobile menu exposes real catalogue navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const trigger = page.getByRole('button', { name: 'Browse sections' });
  await expect(trigger).toBeVisible();
  await trigger.click();
  const menu = page.locator('[data-slot="dropdown-menu-content"]');
  await expect(menu).toBeVisible();
  await menu.getByRole('menuitem', { name: 'Manga' }).click();
  await expect(page).toHaveURL(/\/manga\/?$/);
  await page.getByRole('button', { name: 'Browse sections' }).click();
  await page.getByRole('menuitem', { name: 'Music' }).click();
  await expect(page).toHaveURL(/\/music\/?$/);
});
