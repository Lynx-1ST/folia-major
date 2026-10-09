import core from './vi-core';
import options from './vi-options';
import guides from './vi-guides';
import commandPalette from './vi-commands';

// src/i18n/locales/vi.ts
// Vietnamese resources split by interface, settings, and help content.
export default { ...core, options, ...guides, commandPalette };
