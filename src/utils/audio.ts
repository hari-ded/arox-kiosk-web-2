import { useSyncExternalStore } from 'react';

const SOUND_STORAGE_KEY = 'arox:kiosk-sound-enabled';
const DEFAULT_SOUND_ENABLED = (import.meta.env.VITE_KIOSK_SOUND_ENABLED ?? 'true') !== 'false';

const readStoredSoundSetting = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_SOUND_ENABLED;
  }

  try {
    const stored = window.localStorage.getItem(SOUND_STORAGE_KEY);
    if (stored === null) return DEFAULT_SOUND_ENABLED;
    return stored === 'true';
  } catch {
    return DEFAULT_SOUND_ENABLED;
  }
};

let kioskSoundEnabled = readStoredSoundSetting();
const soundListeners = new Set<() => void>();

const notifySoundListeners = () => {
  soundListeners.forEach((listener) => listener());
};

const setStoredSoundSetting = (enabled: boolean) => {
  kioskSoundEnabled = enabled;

  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
  } catch {
    // Persisting sound state is best-effort only.
  }

  notifySoundListeners();
};

export const isKioskSoundEnabled = () => kioskSoundEnabled;

export const setKioskSoundEnabled = (enabled: boolean) => {
  setStoredSoundSetting(enabled);
};

export const toggleKioskSoundEnabled = () => {
  setStoredSoundSetting(!kioskSoundEnabled);
};

export const useKioskSoundEnabled = () =>
  useSyncExternalStore(
    (listener) => {
      soundListeners.add(listener);
      return () => soundListeners.delete(listener);
    },
    () => kioskSoundEnabled,
    () => DEFAULT_SOUND_ENABLED,
  );

const VOICE_SOURCES = {
  pickup: '/assets/voice/pickup.mp3',
  enterCode: '/assets/voice/enter_your_pickup_code.mp3',
  printingWait: '/assets/voice/printing_wait.mp3',
  printComplete: '/assets/voice/print_complete.mp3',
  printFailed: '/assets/voice/failed.mp3',
  otpFailed: '/assets/voice/otp_failed.mp3',
  thankYou: '/assets/voice/thank_you.mp3',
} as const;

export type VoiceKey = keyof typeof VOICE_SOURCES;

let audioCtx: AudioContext | null = null;
let activeVoiceAudio: HTMLAudioElement | null = null;
let lastVoiceKey: VoiceKey | null = null;
let lastVoiceAt = 0;

const ensureAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }

  return audioCtx;
};

const playVoiceAsset = (key: VoiceKey) => {
  if (!kioskSoundEnabled) return;

  try {
    const now = Date.now();
    if (lastVoiceKey === key && now - lastVoiceAt < 900) {
      return;
    }

    lastVoiceKey = key;
    lastVoiceAt = now;

    if (activeVoiceAudio) {
      activeVoiceAudio.pause();
      activeVoiceAudio.currentTime = 0;
      activeVoiceAudio = null;
    }

    const audio = new Audio(VOICE_SOURCES[key]);
    audio.volume = 1;
    activeVoiceAudio = audio;
    audio.play().catch((error) => {
      console.warn(`Failed to play voice asset: ${key}`, error);
    });
  } catch (error) {
    console.warn(`Failed to initialize voice asset: ${key}`, error);
  }
};

const playTone = (frequencies: number[], duration = 0.12, spacing = 0.05) => {
  if (!kioskSoundEnabled) return;

  try {
    const ctx = ensureAudioContext();
    let startAt = ctx.currentTime;

    frequencies.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, startAt);
      gainNode.gain.setValueAtTime(0.001, startAt);
      gainNode.gain.exponentialRampToValueAtTime(0.035, startAt + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startAt + duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(startAt);
      oscillator.stop(startAt + duration + 0.02);

      startAt += index === frequencies.length - 1 ? duration : spacing;
    });
  } catch (error) {
    console.warn('Error tone play failed', error);
  }
};

export const playClickSound = () => {
  if (!kioskSoundEnabled) return;

  try {
    const ctx = ensureAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(520, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(640, ctx.currentTime + 0.04);

    gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.045);
  } catch (error) {
    console.warn('Audio play failed', error);
  }
};

const voiceTextMap: Array<{ match: RegExp; key: VoiceKey }> = [
  { match: /pick up code|pickup code|enter your pickup code/i, key: 'enterCode' },
  { match: /scan your qr code/i, key: 'pickup' },
  { match: /printing your document|please wait while your document prints/i, key: 'printingWait' },
  { match: /success|please collect your pages|printed/i, key: 'printComplete' },
  { match: /print failed|contact support/i, key: 'printFailed' },
  { match: /otp failed|invalid otp/i, key: 'otpFailed' },
  { match: /thank you/i, key: 'thankYou' },
];

export const playVoiceMessage = (text: string) => {
  if (!kioskSoundEnabled) return;

  const matched = voiceTextMap.find((entry) => entry.match.test(text));
  if (matched) {
    playVoiceAsset(matched.key);
  }
};

export const playErrorTone = () => {
  playTone([420, 360, 300], 0.11, 0.08);
};

export const playSuccessChime = () => {
  if (!kioskSoundEnabled) return;

  try {
    const ctx = ensureAudioContext();
    const notes = [523, 659, 784];

    notes.forEach((frequency, index) => {
      const startAt = ctx.currentTime + index * 0.09;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, startAt);

      gainNode.gain.setValueAtTime(0.001, startAt);
      gainNode.gain.exponentialRampToValueAtTime(0.04, startAt + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startAt + 0.08);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(startAt);
      oscillator.stop(startAt + 0.1);
    });
  } catch (error) {
    console.warn('Success chime play failed', error);
  }
};

export { playVoiceAsset };
