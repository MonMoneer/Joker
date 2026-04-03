"use client";

let soundEnabled = true;

const audioCache = new Map<string, HTMLAudioElement>();

function getAudio(path: string): HTMLAudioElement {
  if (!audioCache.has(path)) {
    const audio = new Audio(path);
    audioCache.set(path, audio);
  }
  return audioCache.get(path)!;
}

export function playSound(name: string, volume = 0.5): void {
  if (!soundEnabled) return;
  try {
    const paths: Record<string, string> = {
      cardPlay: "/sounds/card-play.mp3",
      cardFlip: "/sounds/card-flip.mp3",
      cardShuffle: "/sounds/card-shuffle.mp3",
      bidPlace: "/sounds/bid-place.mp3",
      trickWin: "/sounds/trick-win.mp3",
      gameWin: "/sounds/game-win.mp3",
      histPenalty: "/sounds/hist-penalty.mp3",
      yourTurn: "/sounds/your-turn.mp3",
    };
    const path = paths[name];
    if (!path) return;

    const audio = getAudio(path);
    audio.volume = volume;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {}
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}
