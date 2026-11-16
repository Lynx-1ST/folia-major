import { describe, expect, it } from 'vitest';
import { buildUpdateChannelOptions, isPublicUpdateChannel, UPDATE_CHANNEL_VALUES } from '../../../src/components/modal/settings/pages/GeneralPage';

// Keeps the Vietnamese release lane selectable from the settings page.
describe('general update channels', () => {
    it('offers the Vietnamese lane and accepts its selection callback value', () => {
        expect(UPDATE_CHANNEL_VALUES).toContain('vietnamese');
        expect(buildUpdateChannelOptions(key => key).map(option => option.value)).toContain('vietnamese');
        expect(isPublicUpdateChannel('vietnamese')).toBe(true);
        expect(isPublicUpdateChannel('internal')).toBe(false);
    });
});
