import { expect, test } from '@playwright/test';
import { APP_VERSION, GUIDE_VERSION_STORAGE_KEY, waitForAppMounted } from '../helpers/appState';

// test/ui/vietnameseLanguage.spec.ts
// Checks the real language selector, saved preference, and translated command search.
test('switches to Vietnamese and retains it after reload', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.addInitScript(([version, guideKey]) => {
        if (!localStorage.getItem('folia_app_language')) {
            localStorage.setItem('folia_app_language', 'en');
            localStorage.setItem('i18nextLng', 'en');
        }
        localStorage.setItem('static_mode', 'true');
        localStorage.setItem('playback_entry_view_chosen', 'true');
        localStorage.setItem('library_suite_prompt_seen', 'true');
        localStorage.setItem(guideKey, version);
    }, [APP_VERSION, GUIDE_VERSION_STORAGE_KEY]);
    await page.route('**/__mock_netease__/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
    await page.goto('/');
    await waitForAppMounted(page);
    const openGeneral = () => page.evaluate(async () => {
        const modulePath = '/src/stores/useSettingsModalStore.ts';
        const { useSettingsModalStore } = await import(modulePath);
        useSettingsModalStore.getState().openSettings('options', 'general', null, 'languageSettings');
    });
    await openGeneral();
    await page.getByRole('combobox', { name: /^Interface language/ }).click();
    await page.getByRole('option', { name: 'Vietnamese', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
    await expect(page.getByRole('combobox', { name: /^Ngôn ngữ giao diện/ })).toContainText('Tiếng Việt');
    expect(await page.evaluate(() => localStorage.getItem('folia_app_language'))).toBe('vi');

    await page.reload();
    await waitForAppMounted(page);
    await openGeneral();
    await expect(page.getByRole('combobox', { name: /^Ngôn ngữ giao diện/ })).toContainText('Tiếng Việt');
    await expect(page.getByRole('dialog', { name: 'Cài đặt', exact: true })).toHaveCSS('opacity', '1');
    await page.screenshot({ path: 'test-results/vietnamese-settings.png', fullPage: true, animations: 'disabled' });
    await page.evaluate(async () => {
        const modulePath = '/src/components/command-palette/commandRegistry.ts';
        const { getCommandPaletteMatches } = await import(modulePath);
        if (!getCommandPaletteMatches('tiếng việt').some((match: any) => match.command.id === 'settings-language-vi')) {
            throw new Error('Vietnamese command is not searchable');
        }
    });
    expect(pageErrors).toEqual([]);
});
