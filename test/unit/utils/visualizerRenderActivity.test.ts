import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import VisualizerRenderer from '../../../src/components/visualizer/VisualizerRenderer';

// Hidden main windows must not instantiate heavy visualizer runtimes; other hosts opt in by default.
const render = vi.hoisted(() => vi.fn(() => null));
vi.mock('../../../src/components/visualizer/registry', () => ({ getVisualizerRegistryEntry: () => ({ render }) }));
vi.mock('../../../src/components/visualizer/tuningRegistry', () => ({ applyVisualizerTuning: (_mode: unknown, props: unknown) => props }));
vi.mock('../../../src/components/visualizer/backgrounds/registry', () => ({ DEFAULT_VISUALIZER_BACKGROUND_MODE: 'common' }));
vi.mock('../../../src/components/visualizer/VisualizerHarmonyOverlay', () => ({ default: () => null }));
vi.mock('../../../src/components/visualizer/useHandoffCover', () => ({ useHandoffCover: () => undefined }));
vi.mock('../../../src/hooks/useReducedMotionFor', () => ({ useReducedMotionFor: () => false }));
vi.mock('../../../src/components/visualizer/VisualizerBackdrop', () => ({ default: ({ children }: { children: unknown }) => children }));
vi.mock('../../../src/components/visualizer/styleTransition/VisualizerStyleTransition', () => ({
    useStyleSwitch: () => ({ waits: false }),
    default: ({ renderStyle }: { renderStyle: (mode: string) => unknown }) => renderStyle('classic'),
}));

type Props = Parameters<typeof VisualizerRenderer>[0];
beforeEach(() => render.mockClear());
describe('visualizer host activity', () => {
    it('does not construct a renderer while the main host is suspended', () => {
        expect(VisualizerRenderer({ mode: 'classic', renderEnabled: false } as Props)).toBeNull();
        expect(render).not.toHaveBeenCalled();
    });
    it('constructs a fresh renderer when the main host resumes', () => {
        renderToStaticMarkup(createElement(VisualizerRenderer, { mode: 'classic', renderEnabled: false } as Props));
        renderToStaticMarkup(createElement(VisualizerRenderer, { mode: 'classic', renderEnabled: true } as Props));
        expect(render).toHaveBeenCalledOnce();
    });
    it('keeps independent OBS and preview hosts enabled by default', () => {
        renderToStaticMarkup(createElement(VisualizerRenderer, { mode: 'classic' } as Props));
        expect(render).toHaveBeenCalledOnce();
    });
});
