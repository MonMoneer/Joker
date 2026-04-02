import type { Rank, Suit, SetNumber, HandConfig } from './types';

// Card rank order (high to low)
export const RANK_ORDER: readonly Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6'] as const;

// Rank values for comparison (higher = better)
export const RANK_VALUES: Record<Rank, number> = {
  'A': 9,
  'K': 8,
  'Q': 7,
  'J': 6,
  '10': 5,
  '9': 4,
  '8': 3,
  '7': 2,
  '6': 1,
};

export const ALL_SUITS: readonly Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'] as const;

// Red suits have 6s; black suits do not (replaced by Jokers)
export const RED_SUITS: readonly Suit[] = ['hearts', 'diamonds'] as const;
export const BLACK_SUITS: readonly Suit[] = ['clubs', 'spades'] as const;

// Ranks available per suit
// Red suits: A-K-Q-J-10-9-8-7-6 (9 cards)
// Black suits: A-K-Q-J-10-9-8-7 (8 cards, no 6)
export const RED_SUIT_RANKS: readonly Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6'] as const;
export const BLACK_SUIT_RANKS: readonly Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7'] as const;

// Total cards in deck
export const DECK_SIZE = 36; // 9+9+8+8 + 2 Jokers = 36

// Number of players
export const NUM_PLAYERS = 4;

// Set definitions
export const SET_CONFIGS: Record<SetNumber, { handsCount: number; cardsSequence: number[] }> = {
  1: { handsCount: 8, cardsSequence: [1, 2, 3, 4, 5, 6, 7, 8] },       // Ascending
  2: { handsCount: 4, cardsSequence: [9, 9, 9, 9] },                     // Full deal
  3: { handsCount: 8, cardsSequence: [8, 7, 6, 5, 4, 3, 2, 1] },        // Descending
  4: { handsCount: 4, cardsSequence: [9, 9, 9, 9] },                     // Full deal
};

// Generate the full 24-hand sequence
export function generateHandSequence(): HandConfig[] {
  const hands: HandConfig[] = [];
  let globalHand = 1;

  for (const setNum of [1, 2, 3, 4] as SetNumber[]) {
    const config = SET_CONFIGS[setNum];
    for (let i = 0; i < config.handsCount; i++) {
      hands.push({
        handNumber: globalHand,
        setNumber: setNum,
        cardsPerPlayer: config.cardsSequence[i],
        handInSet: i + 1,
      });
      globalHand++;
    }
  }

  return hands;
}

// Total hands in a game
export const TOTAL_HANDS = 24;

// Scoring constants
export const SCORING = {
  SUCCESS_MULTIPLIER: 50,   // bid * 50
  SUCCESS_BONUS: 50,        // + 50 bonus
  PASS_SUCCESS: 50,         // bid 0, won 0
  BID_ALL_MULTIPLIER: 100,  // bid all * 100 (double reward)
  FAIL_PER_TRICK: 10,       // tricks_won * 10
} as const;

// Room code characters (no ambiguous O/0, I/1, l)
export const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LENGTH = 4;

// Timing constants (milliseconds)
export const TIMING = {
  AI_THINK_MIN: 800,
  AI_THINK_MAX: 2500,
  TRICK_RESULT_DISPLAY: 1500,
  HAND_RESULT_DISPLAY: 3000,
  DEAL_ANIMATION: 500,
  RECONNECT_TIMEOUT: 120000, // 2 minutes
  ROOM_EXPIRY: 600000,       // 10 minutes
} as const;

// Suit display symbols
export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

// Suit colors
export const SUIT_COLORS: Record<Suit, 'red' | 'black'> = {
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black',
  spades: 'black',
};
