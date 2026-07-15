export const KIOSK_CONFIG = {
  enableVoice: true,
  enableClickSound: true,
};

const VOICE_SOURCES = {
  pickup: '/assets/voice/pickup.mp3',
  enterCode: '/assets/voice/enter_your_pickup_code.mp3',
  printingWait: '/assets/voice/printing_wait.mp3',
  printComplete: '/assets/voice/print_complete.mp3',
  printFailed: '/assets/voice/failed.mp3',
  otpFailed: '/assets/voice/invalid_code.mp3',
  thankYou: '/assets/voice/thank_you.mp3',
} as const;

export type VoiceKey = keyof typeof VOICE_SOURCES;

let audioCtx: AudioContext | null = null;
let activeVoiceAudio: HTMLAudioElement | null = null;
let lastVoiceKey: VoiceKey | null = null;
let lastVoiceAt = 0;
let audioUnlocked = false;
let queuedVoiceKey: VoiceKey | null = null;

const ensureAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }

  if (audioCtx.state === 'running') {
    audioUnlocked = true;
  }

  return audioCtx;
};

const stopActiveVoice = () => {
  if (activeVoiceAudio) {
    activeVoiceAudio.pause();
    activeVoiceAudio.currentTime = 0;
    activeVoiceAudio = null;
  }
};

const flushQueuedVoice = () => {
  if (!queuedVoiceKey || !audioUnlocked) return;

  const key = queuedVoiceKey;
  queuedVoiceKey = null;
  window.setTimeout(() => {
    void playVoiceAsset(key);
  }, 0);
};

export const unlockKioskAudio = () => {
  audioUnlocked = true;
  try {
    ensureAudioContext();
  } catch (error) {
    console.warn('Failed to unlock kiosk audio context', error);
  }

  flushQueuedVoice();
};

const playVoiceAsset = (key: VoiceKey) => {
  if (!KIOSK_CONFIG.enableVoice) return;

  try {
    const now = Date.now();
    if (lastVoiceKey === key && now - lastVoiceAt < 900) {
      return;
    }

    lastVoiceKey = key;
    lastVoiceAt = now;

    const ctx = ensureAudioContext();
    if (!audioUnlocked && ctx.state !== 'running') {
      queuedVoiceKey = key;
      return;
    }

    stopActiveVoice();

    const audio = new Audio(VOICE_SOURCES[key]);
    audio.preload = 'auto';
    audio.volume = 1;
    audio.playbackRate = 1;
    activeVoiceAudio = audio;

    audio.play().catch((error) => {
      queuedVoiceKey = key;
      console.warn(`Failed to play voice asset: ${key}`, error);
    });

    audio.addEventListener('ended', () => {
      if (activeVoiceAudio === audio) {
        activeVoiceAudio = null;
      }
    }, { once: true });
  } catch (error) {
    queuedVoiceKey = key;
    console.warn(`Failed to initialize voice asset: ${key}`, error);
  }
};

const playTone = (frequencies: number[], duration = 0.12, spacing = 0.05) => {
  if (!KIOSK_CONFIG.enableVoice && !KIOSK_CONFIG.enableClickSound) return;

  try {
    unlockKioskAudio();
    const ctx = ensureAudioContext();
    let startAt = ctx.currentTime;

    frequencies.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, startAt);
      gainNode.gain.setValueAtTime(0.001, startAt);
      gainNode.gain.exponentialRampToValueAtTime(0.08, startAt + 0.01);
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
  if (!KIOSK_CONFIG.enableVoice && !KIOSK_CONFIG.enableClickSound) return;

  try {
    unlockKioskAudio();
    const ctx = ensureAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(560, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(760, ctx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.06);
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
  { match: /otp failed|invalid otp|invalid code/i, key: 'otpFailed' },
  { match: /thank you/i, key: 'thankYou' },
];

export const playVoiceMessage = (text: string) => {
  if (!KIOSK_CONFIG.enableVoice) return;

  const matched = voiceTextMap.find((entry) => entry.match.test(text));
  if (matched) {
    playVoiceAsset(matched.key);
  }
};

export const playErrorTone = () => {
  unlockKioskAudio();
  playTone([420, 360, 300], 0.11, 0.08);
};

export { playVoiceAsset };
