import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MutableRefObject } from 'react';

// The visual-work gate must skip FFT without stopping playback/lyric clocks.
const fixture = vi.hoisted(() => ({
    analysisEnabled: false,
    effect: undefined as (() => (() => void)) | undefined,
    signal: () => ({ set: vi.fn() }),
}));
vi.mock('react', () => ({
    useCallback: (callback: unknown) => callback,
    useRef: (current: unknown) => ({ current }),
    useEffect: (effect: () => (() => void)) => { fixture.effect = effect; },
}));
vi.mock('../../../src/hooks/useMainWindowRenderActivity', () => ({
    useMainWindowRenderActivity: () => ({ audioAnalysisEnabled: fixture.analysisEnabled }),
}));
vi.mock('../../../src/utils/appPlaybackHelpers', () => ({ findLatestActiveLineIndex: () => -1 }));
vi.mock('../../../src/stores/usePlaybackStore', () => ({
    usePlaybackStore: (selector: (state: unknown) => unknown) => selector({
        activePlaybackContext: 'main', playerState: 'PLAYING', duration: 120,
    }),
    selectDisplayLyrics: () => null,
    setCurrentLineIndex: vi.fn(), setPlayerState: vi.fn(),
}));
vi.mock('../../../src/stores/motionSignals', () => ({
    audioPower: fixture.signal(), currentTime: fixture.signal(), lyricCurrentTime: fixture.signal(),
    audioBands: Object.fromEntries(['bass', 'lowMid', 'mid', 'vocal', 'treble', 'spectrum'].map(key => [key, fixture.signal()])),
}));

import { audioPower, currentTime, lyricCurrentTime } from '../../../src/stores/motionSignals';
import { usePlaybackVisualizerBridge } from '../../../src/hooks/usePlaybackVisualizerBridge';

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
});
afterEach(() => vi.unstubAllGlobals());

describe('playback visual activity gate', () => {
    it.each([false, true])('preserves clocks with audio analysis enabled=%s', (enabled) => {
        fixture.analysisEnabled = enabled;
        const analyser = { frequencyBinCount: 1024, getByteFrequencyData: vi.fn() };
        usePlaybackVisualizerBridge({
            audioRef: { current: { paused: false, ended: false, currentTime: 42 } } as MutableRefObject<HTMLAudioElement>,
            analyserRef: { current: analyser } as unknown as MutableRefObject<AnalyserNode>,
            animationFrameRef: { current: 0 }, effectiveLoopMode: 'off',
            isNowPlayingStageActive: false, isPlayerCapStageActive: false,
            stageActiveEntryKind: null, stageLyricsSession: null,
            stageLyricsClockRef: { current: { startTimeSec: 0, endTimeSec: 120, baseTimeSec: 0, startedAtMs: null } },
            getSyntheticStageLyricsTime: () => 0, syncStageLyricsClock: vi.fn(),
            getNowPlayingDisplayTime: () => 0, getPlayerCapDisplayTime: () => 0,
            syncNowPlayingClock: vi.fn(), lyricTimelineOffsetMs: 500,
            isTransitionAudible: () => false,
        });
        const cleanup = fixture.effect!();
        const frame = vi.mocked(requestAnimationFrame).mock.calls[0][0];
        frame(0);
        expect(analyser.getByteFrequencyData).toHaveBeenCalledTimes(enabled ? 1 : 0);
        expect(audioPower.set).toHaveBeenCalledTimes(enabled ? 1 : 0);
        expect(currentTime.set).toHaveBeenCalledWith(42);
        expect(lyricCurrentTime.set).toHaveBeenCalledWith(41.5);
        expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
        cleanup();
        expect(cancelAnimationFrame).toHaveBeenCalledOnce();
    });
});
