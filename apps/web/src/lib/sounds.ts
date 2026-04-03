"use client";

import { Howl } from "howler";

// Sound effect definitions — paths relative to /public/sounds/
// These will be created as simple synth sounds or loaded from files
const SOUNDS = {
  cardPlay: { src: "/sounds/card-play.mp3", volume: 0.5 },
  cardFlip: { src: "/sounds/card-flip.mp3", volume: 0.4 },
  cardShuffle: { src: "/sounds/card-shuffle.mp3", volume: 0.3 },
  bidPlace: { src: "/sounds/bid-place.mp3", volume: 0.5 },
  trickWin: { src: "/sounds/trick-win.mp3", volume: 0.6 },
  handComplete: { src: "/sounds/hand-complete.mp3", volume: 0.5 },
  gameWin: { src: "/sounds/game-win.mp3", volume: 0.7 },
  kingCrown: { src: "/sounds/king-crown.mp3", volume: 0.8 },
  error: { src: "/sounds/error.mp3", volume: 0.4 },
  turn: { src: "/sounds/your-turn.mp3", volume: 0.5 },
} as const;

type SoundName = keyof typeof SOUNDS;

const howlCache = new Map<SoundName, Howl>();
let soundEnabled = true;

function getHowl(name: SoundName): Howl {
  if (!howlCache.has(name)) {
    const config = SOUNDS[name];
    const howl = new Howl({
      src: [config.src],
      volume: config.volume,
      preload: false, // Lazy load
    });
    howlCache.set(name, howl);
  }
  return howlCache.get(name)!;
}

export function playSound(name: SoundName): void {
  if (!soundEnabled) return;
  try {
    const howl = getHowl(name);
    howl.play();
  } catch {
    // Silently fail if sound not available
  }
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function preloadSounds(): void {
  // Preload commonly used sounds
  const common: SoundName[] = ["cardPlay", "bidPlace", "trickWin", "turn"];
  for (const name of common) {
    getHowl(name).load();
  }
}
