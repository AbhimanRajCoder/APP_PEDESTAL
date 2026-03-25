import { Audio } from 'expo-av';

const sounds: Record<string, Audio.Sound | null> = {};

// Pre-generated simple beep sounds using expo-av tone generation
// We use short inline audio for maximum compatibility

export async function playSound(type: 'correct' | 'wrong' | 'tap' | 'levelup' | 'flip' | 'complete') {
    try {
        // Use system sounds via Haptics as primary feedback
        // and simple tone generation as audio feedback
        const frequencies: Record<string, number[]> = {
            correct: [800, 1000],
            wrong: [300, 200],
            tap: [600],
            levelup: [523, 659, 784, 1047],
            flip: [500, 700],
            complete: [523, 659, 784, 880, 1047],
        };

        const freqs = frequencies[type] || [440];

        // Create a simple oscillator-like sound using expo-av
        const { sound } = await Audio.Sound.createAsync(
            { uri: `data:audio/wav;base64,${generateTone(freqs[0], 0.15)}` },
            { shouldPlay: true, volume: 0.3 }
        );

        sound.setOnPlaybackStatusUpdate((status) => {
            if ('didJustFinish' in status && status.didJustFinish) {
                sound.unloadAsync();
            }
        });
    } catch (e) {
        // Silently fail — sound is not critical
        console.log('Sound playback skipped:', e);
    }
}

// Generate a simple WAV tone as base64
function generateTone(frequency: number, duration: number): string {
    const sampleRate = 8000;
    const numSamples = Math.floor(sampleRate * duration);

    // WAV header
    const header = new ArrayBuffer(44 + numSamples);
    const view = new DataView(header);

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples, true);
    writeString(view, 8, 'WAVE');

    // fmt chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate, true); // byte rate
    view.setUint16(32, 1, true); // block align
    view.setUint16(34, 8, true); // bits per sample

    // data chunk
    writeString(view, 36, 'data');
    view.setUint32(40, numSamples, true);

    // Generate sine wave
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const envelope = Math.min(1, Math.min(t * 20, (duration - t) * 20)); // fade in/out
        const sample = Math.floor(128 + 80 * envelope * Math.sin(2 * Math.PI * frequency * t));
        view.setUint8(44 + i, Math.max(0, Math.min(255, sample)));
    }

    // Convert to base64
    const bytes = new Uint8Array(header);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}
