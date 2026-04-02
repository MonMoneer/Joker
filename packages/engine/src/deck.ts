import type { Card, SuitCard, JokerCard, Suit, Rank } from './types';
import { RED_SUITS, BLACK_SUITS, RED_SUIT_RANKS, BLACK_SUIT_RANKS, DECK_SIZE, NUM_PLAYERS } from './constants';

/**
 * Creates the standard 36-card Georgian Joker deck.
 * - Red suits (hearts, diamonds): A-K-Q-J-10-9-8-7-6 (9 cards each)
 * - Black suits (clubs, spades): A-K-Q-J-10-9-8-7 (8 cards each, no 6)
 * - 2 Jokers (replacing the black 6s)
 * Total: 18 + 16 + 2 = 36 cards
 */
export function createDeck(): Card[] {
  const cards: Card[] = [];

  // Red suits with all ranks including 6
  for (const suit of RED_SUITS) {
    for (const rank of RED_SUIT_RANKS) {
      cards.push({ type: 'suit', suit, rank });
    }
  }

  // Black suits without 6
  for (const suit of BLACK_SUITS) {
    for (const rank of BLACK_SUIT_RANKS) {
      cards.push({ type: 'suit', suit, rank });
    }
  }

  // Two Jokers
  cards.push({ type: 'joker', id: 1 });
  cards.push({ type: 'joker', id: 2 });

  return cards;
}

/**
 * Fisher-Yates shuffle algorithm.
 * Returns a new shuffled array (does not mutate input).
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deals cards to players from a shuffled deck.
 *
 * @param deck - The shuffled deck
 * @param cardsPerPlayer - Number of cards each player gets
 * @returns Object with player hands and remaining deck
 *
 * For Sets 1 & 3: remaining deck has cards left (for trump determination)
 * For Sets 2 & 4: all 36 cards dealt (9 per player), no remaining
 */
export function dealCards(
  deck: Card[],
  cardsPerPlayer: number
): { hands: Card[][]; remaining: Card[] } {
  const totalCards = cardsPerPlayer * NUM_PLAYERS;

  if (totalCards > deck.length) {
    throw new Error(
      `Cannot deal ${cardsPerPlayer} cards to ${NUM_PLAYERS} players from a deck of ${deck.length}`
    );
  }

  const hands: Card[][] = [[], [], [], []];

  // Deal cards one at a time to each player (round-robin, like real dealing)
  for (let cardNum = 0; cardNum < cardsPerPlayer; cardNum++) {
    for (let player = 0; player < NUM_PLAYERS; player++) {
      hands[player].push(deck[cardNum * NUM_PLAYERS + player]);
    }
  }

  const remaining = deck.slice(totalCards);

  return { hands, remaining };
}

/**
 * Sorts a hand by suit then rank (for display purposes).
 * Jokers come first, then suits in order: spades, hearts, diamonds, clubs.
 */
export function sortHand(hand: Card[]): Card[] {
  const suitOrder: Record<Suit, number> = {
    spades: 0,
    hearts: 1,
    diamonds: 2,
    clubs: 3,
  };

  const rankOrder: Record<Rank, number> = {
    'A': 0, 'K': 1, 'Q': 2, 'J': 3, '10': 4,
    '9': 5, '8': 6, '7': 7, '6': 8,
  };

  return [...hand].sort((a, b) => {
    // Jokers first
    if (a.type === 'joker' && b.type === 'joker') return a.id - b.id;
    if (a.type === 'joker') return -1;
    if (b.type === 'joker') return 1;

    // Then by suit
    const suitDiff = suitOrder[a.suit] - suitOrder[b.suit];
    if (suitDiff !== 0) return suitDiff;

    // Then by rank (high to low)
    return rankOrder[a.rank] - rankOrder[b.rank];
  });
}
