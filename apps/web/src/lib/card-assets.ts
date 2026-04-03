import type { Card, SuitCard, JokerCard, Suit, Rank } from "@joker/engine";
import { isSuitCard, isJokerCard } from "@joker/engine";

const RANK_MAP: Record<Rank, string> = {
  A: "ace", K: "king", Q: "queen", J: "jack",
  "10": "10", "9": "9", "8": "8", "7": "7", "6": "6",
};

const SUIT_MAP: Record<Suit, string> = {
  hearts: "hearts", diamonds: "diamonds", clubs: "clubs", spades: "spades",
};

export function getCardImagePath(card: Card): string {
  if (isJokerCard(card)) return `/cards-webp/joker-${card.id}.webp`;
  if (isSuitCard(card)) return `/cards-webp/${RANK_MAP[card.rank]}-${SUIT_MAP[card.suit]}.webp`;
  return `/cards-webp/card-back.webp`;
}

export function getCardBackPath(): string {
  return "/cards-webp/card-back.webp";
}

// Preload all card images in background
let preloaded = false;
export function preloadAllCards(): void {
  if (preloaded || typeof window === "undefined") return;
  preloaded = true;

  const ranks = ["ace","king","queen","jack","10","9","8","7","6"];
  const suits = ["hearts","diamonds","clubs","spades"];
  const paths: string[] = [];

  for (const r of ranks) {
    for (const s of suits) {
      paths.push(`/cards-webp/${r}-${s}.webp`);
    }
  }
  paths.push("/cards-webp/joker-1.webp", "/cards-webp/joker-2.webp", "/cards-webp/card-back.webp");

  // Preload card-back first (most used), then rest
  const backImg = new Image();
  backImg.src = "/cards-webp/card-back.webp";

  // Load rest after a short delay to not block initial render
  setTimeout(() => {
    for (const p of paths) {
      const img = new Image();
      img.src = p;
    }
  }, 500);
}
