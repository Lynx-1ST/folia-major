import { beforeEach, describe, expect, it } from 'vitest';
import type { SongResult } from '../../../src/types';
import { usePlaybackStore } from '../../../src/stores/usePlaybackStore';
import { watchDeferredAudioQuality } from '../../../src/services/deferredAudioQuality';

// test/unit/services/deferredAudioQuality.test.ts
// Rejects metadata from an old song or an earlier playback attempt of the same song.
const song: SongResult = { id: 42, name: 'Test', artists: [], album: { id: 1, name: 'Test' }, durationMs: 1000 };
beforeEach(() => { usePlaybackStore.setState({ currentSong: song, audioSrc: 'blob:current', playQueue: [song] }); });
const flush = () => new Promise(resolve => setImmediate(resolve));

describe('deferred playback quality', () => {
    it('updates the current song and queue after background work completes', async () => {
        watchDeferredAudioQuality(song, 'blob:current', Promise.resolve({ bitrate: 320000 }));
        await flush();
        expect(usePlaybackStore.getState().currentSong?.audioQualityInfo).toEqual({ bitrate: 320000 });
        expect(usePlaybackStore.getState().playQueue[0].audioQualityInfo).toEqual({ bitrate: 320000 });
    });
    it('does not overwrite a different song after a track change', async () => {
        watchDeferredAudioQuality(song, 'blob:current', Promise.resolve({ bitrate: 320000 }));
        usePlaybackStore.setState({ currentSong: { ...song, id: 43 } });
        await flush();
        expect(usePlaybackStore.getState().currentSong?.audioQualityInfo).toBeUndefined();
    });
    it('does not overwrite a new source for the same song', async () => {
        watchDeferredAudioQuality(song, 'blob:old', Promise.resolve({ bitrate: 320000 }));
        await flush();
        expect(usePlaybackStore.getState().currentSong?.audioQualityInfo).toBeUndefined();
    });
    it('ignores background failures', async () => {
        watchDeferredAudioQuality(song, 'blob:current', Promise.reject(new Error('Parser failed')));
        await flush();
        expect(usePlaybackStore.getState().audioSrc).toBe('blob:current');
    });
});
