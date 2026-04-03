import type { Card, SuitCard, JokerCard, Suit, Rank } from "@joker/engine";
import { isSuitCard, isJokerCard } from "@joker/engine";

const RANK_MAP: Record<Rank, string> = {
  A: "ace",
  K: "king",
  Q: "queen",
  J: "jack",
  "10": "10",
  "9": "9",
  "8": "8",
  "7": "7",
  "6": "6",
};

const SUIT_MAP: Record<Suit, string> = {
  hearts: "hearts",
  diamonds: "diamonds",
  clubs: "clubs",
  spades: "spades",
};

export function getCardImagePath(card: Card): string {
  if (isJokerCard(card)) {
    return `/cards/joker-${card.id}.svg`;
  }
  if (isSuitCard(card)) {
    return `/cards/${RANK_MAP[card.rank]}-${SUIT_MAP[card.suit]}.svg`;
  }
  return "/cards/card-back.svg";
}

export function getCardBackPath(): string {
  return "/cards/card-back.svg";
}
