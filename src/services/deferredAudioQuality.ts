import type { SongResult } from '../types';
import type { AudioQualityInfo } from '../types/audioQuality';
import { usePlaybackStore } from '../stores/usePlaybackStore';
import { isSamePlaybackSong } from '../utils/appPlaybackGuards';

// src/services/deferredAudioQuality.ts
// Applies background metadata only while the exact playback source still owns the current song.
export function watchDeferredAudioQuality(song: SongResult, audioSrc: string, ready?: Promise<AudioQualityInfo | undefined>): void {
    if (!ready) return;
    void ready.then(info => {
        const state = usePlaybackStore.getState();
        if (!info || state.audioSrc !== audioSrc || !state.currentSong || !isSamePlaybackSong(state.currentSong, song)) return;
        usePlaybackStore.setState({
            currentSong: { ...state.currentSong, audioQualityInfo: info },
            playQueue: state.playQueue.map(entry => isSamePlaybackSong(entry, song) ? { ...entry, audioQualityInfo: info } : entry),
        });
    }).catch(() => { /* Metadata is optional and must not interrupt playback. */ });
}
