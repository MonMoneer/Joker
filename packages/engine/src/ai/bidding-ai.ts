import type { Card, TrumpInfo, PlayerIndex, AIDifficulty } from '../types';
import { isSuitCard, isJokerCard } from '../types';
import { RANK_VALUES, ALL_SUITS, NUM_PLAYERS } from '../constants';
import { isTrumpCard } from '../trump';
import { calculateDealerRestriction } from '../bidding';

/**
 * AI bidding strategy.
 * Estimates how many tricks the AI can win based on hand strength.
 */
export function calculateAIBid(
  hand: Card[],
  trump: TrumpInfo,
  playerIndex: PlayerIndex,
  existingBids: (number | null)[],
  cardsPerPlayer: number,
  dealerIndex: PlayerIndex,
  difficulty: AIDifficulty
): number {
  let expectedTricks = estimateTricks(hand, trump, difficulty);

  // Add noise based on difficulty
  if (difficulty === 'easy') {
    expectedTricks += (Math.random() - 0.5) * 2; // +/- 1
  } else if (difficulty === 'medium') {
    expectedTricks += (Math.random() - 0.5) * 0.8; // +/- 0.4
  }
  // Hard: no noise

  let bid = Math.round(Math.max(0, Math.min(expectedTricks, cardsPerPlayer)));

  // Enforce dealer restriction
  if (playerIndex === dealerIndex) {
    const restricted = calculateDealerRestriction(existingBids, cardsPerPlayer);
    if (restricted !== null && bid === restricted) {
      // Adjust bid: prefer going down, then up
      if (bid > 0) {
        bid = bid - 1;
      } else {
        bid = bid + 1;
      }
      bid = Math.max(0, Math.min(bid, cardsPerPlayer));
    }
  }

  return bid;
}

function estimateTricks(hand: Card[], trump: TrumpInfo, difficulty: AIDifficulty): number {
  let expected = 0;

  for (const card of hand) {
    if (isJokerCard(card)) {
      expected += 0.85;
      continue;
    }

    if (!isSuitCard(card)) continue;

    const isTrump = isTrumpCard(card, trump);
    const rankValue = RANK_VALUES[card.rank];

    if (isTrump) {
      // Trump cards
      if (card.rank === 'A') expected += 0.95;
      else if (card.rank === 'K') expected += 0.80;
      else if (card.rank === 'Q') expected += 0.60;
      else if (card.rank === 'J') expected += 0.45;
      else if (card.rank === '10') expected += 0.35;
      else expected += 0.15;
    } else {
      // Non-trump cards
      if (card.rank === 'A') expected += 0.65;
      else if (card.rank === 'K') expected += 0.35;
      else if (card.rank === 'Q') expected += 0.15;
      else expected += 0.05;
    }
  }

  // Hard difficulty: adjust for suit distribution
  if (difficulty === 'hard') {
    const suitCounts = countSuits(hand);
    for (const [suit, count] of Object.entries(suitCounts)) {
      if (count === 0 && !trump.isNoTrump && hasTrumps(hand, trump)) {
        expected += 0.25; // Can trump in on void suits
      }
      if (count === 1) {
        // Singleton: might lose control
        expected -= 0.1;
      }
    }
  }

  return expected;
}

function countSuits(hand: Card[]): Record<string, number> {
  const counts: Record<string, number> = { hearts: 0, diamonds: 0, clubs: 0, spades: 0 };
  for (const card of hand) {
    if (isSuitCard(card)) {
      counts[card.suit]++;
    }
  }
  return counts;
}

function hasTrumps(hand: Card[], trump: TrumpInfo): boolean {
  if (trump.isNoTrump) return false;
  return hand.some(c => isSuitCard(c) && c.suit === trump.suit);
}
