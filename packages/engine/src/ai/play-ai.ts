import type { Card, TrumpInfo, Trick, PlayerIndex, AIDifficulty, TrickPlay } from '../types';
import { isSuitCard, isJokerCard } from '../types';
import { RANK_VALUES } from '../constants';
import { getLegalCardIndices, getLeadSuit } from '../tricks';
import { isTrumpCard } from '../trump';

/**
 * AI card play strategy.
 * Returns the index of the card to play from the hand.
 */
export function chooseCardToPlay(
  hand: Card[],
  trick: Trick,
  trump: TrumpInfo,
  bid: number,
  tricksWon: number,
  cardsRemaining: number,
  difficulty: AIDifficulty
): number {
  const legalIndices = getLegalCardIndices(hand, trick, trump);

  if (legalIndices.length === 0) {
    throw new Error('No legal cards to play');
  }

  if (legalIndices.length === 1) {
    return legalIndices[0]; // Only one option
  }

  switch (difficulty) {
    case 'easy':
      return playEasy(hand, legalIndices);
    case 'medium':
      return playMedium(hand, legalIndices, trick, trump, bid, tricksWon);
    case 'hard':
      return playHard(hand, legalIndices, trick, trump, bid, tricksWon, cardsRemaining);
    default:
      return legalIndices[0];
  }
}

/**
 * Easy AI: mostly random, slight preference for following obvious plays.
 */
function playEasy(hand: Card[], legalIndices: number[]): number {
  return legalIndices[Math.floor(Math.random() * legalIndices.length)];
}

/**
 * Medium AI: basic heuristics.
 */
function playMedium(
  hand: Card[],
  legalIndices: number[],
  trick: Trick,
  trump: TrumpInfo,
  bid: number,
  tricksWon: number
): number {
  const needsTricks = tricksWon < bid;
  const isLeading = trick.plays.length === 0;

  if (isLeading) {
    return leadCard(hand, legalIndices, trump, needsTricks);
  }

  return followCard(hand, legalIndices, trick, trump, needsTricks);
}

/**
 * Hard AI: advanced strategy with card counting awareness.
 */
function playHard(
  hand: Card[],
  legalIndices: number[],
  trick: Trick,
  trump: TrumpInfo,
  bid: number,
  tricksWon: number,
  cardsRemaining: number
): number {
  const tricksNeeded = bid - tricksWon;
  const isLeading = trick.plays.length === 0;

  // If we've already made our bid, try to lose remaining tricks
  if (tricksWon >= bid && bid > 0) {
    return playToLose(hand, legalIndices, trick, trump);
  }

  // If bid 0 (pass), always try to lose
  if (bid === 0) {
    return playToLose(hand, legalIndices, trick, trump);
  }

  if (isLeading) {
    return leadCard(hand, legalIndices, trump, tricksNeeded > 0);
  }

  return followCard(hand, legalIndices, trick, trump, tricksNeeded > 0);
}

/**
 * Choose a card when leading.
 */
function leadCard(
  hand: Card[],
  legalIndices: number[],
  trump: TrumpInfo,
  needsTricks: boolean
): number {
  if (needsTricks) {
    // Lead with strong cards: Aces, then Kings
    const suitCards = legalIndices.filter(i => isSuitCard(hand[i]));

    // Prefer leading with off-suit Aces first
    const offSuitAces = suitCards.filter(i => {
      const c = hand[i];
      return isSuitCard(c) && c.rank === 'A' && !isTrumpCard(c, trump);
    });
    if (offSuitAces.length > 0) return offSuitAces[0];

    // Lead with trump Ace
    const trumpAces = suitCards.filter(i => {
      const c = hand[i];
      return isSuitCard(c) && c.rank === 'A' && isTrumpCard(c, trump);
    });
    if (trumpAces.length > 0) return trumpAces[0];

    // Lead from longest suit
    return leadFromLongestSuit(hand, legalIndices, trump);
  }

  // Don't need tricks: lead low cards
  return getLowestCard(hand, legalIndices, trump);
}

/**
 * Choose a card when following.
 */
function followCard(
  hand: Card[],
  legalIndices: number[],
  trick: Trick,
  trump: TrumpInfo,
  needsTricks: boolean
): number {
  if (needsTricks) {
    // Try to win this trick
    const winningIndex = findLowestWinner(hand, legalIndices, trick, trump);
    if (winningIndex !== null) return winningIndex;
    // Can't win: dump lowest card
    return getLowestCard(hand, legalIndices, trump);
  }

  // Don't need to win: play lowest
  return playToLose(hand, legalIndices, trick, trump);
}

/**
 * Play to deliberately lose the trick.
 */
function playToLose(
  hand: Card[],
  legalIndices: number[],
  trick: Trick,
  trump: TrumpInfo
): number {
  // Avoid trumps and high cards
  const nonTrumpIndices = legalIndices.filter(
    i => isSuitCard(hand[i]) && !isTrumpCard(hand[i], trump)
  );

  if (nonTrumpIndices.length > 0) {
    return getLowestCard(hand, nonTrumpIndices, trump);
  }

  return getLowestCard(hand, legalIndices, trump);
}

/**
 * Find the lowest card that still wins the current trick.
 */
function findLowestWinner(
  hand: Card[],
  legalIndices: number[],
  trick: Trick,
  trump: TrumpInfo
): number | null {
  const leadSuit = getLeadSuit(trick);
  if (!leadSuit) return null;

  // Find current winning value
  let highestTrumpValue = -1;
  let highestSuitValue = -1;
  let hasTrumpInTrick = false;

  for (const play of trick.plays) {
    if (isSuitCard(play.card)) {
      if (isTrumpCard(play.card, trump)) {
        hasTrumpInTrick = true;
        const val = RANK_VALUES[play.card.rank];
        if (val > highestTrumpValue) highestTrumpValue = val;
      } else if (play.card.suit === leadSuit) {
        const val = RANK_VALUES[play.card.rank];
        if (val > highestSuitValue) highestSuitValue = val;
      }
    }
  }

  // Find legal cards that can beat current winner
  const winners: { index: number; value: number }[] = [];

  for (const idx of legalIndices) {
    const card = hand[idx];
    if (isJokerCard(card)) continue; // Don't auto-play Jokers

    if (isSuitCard(card)) {
      if (hasTrumpInTrick) {
        // Need higher trump to win
        if (isTrumpCard(card, trump) && RANK_VALUES[card.rank] > highestTrumpValue) {
          winners.push({ index: idx, value: RANK_VALUES[card.rank] });
        }
      } else {
        // Trump wins, or higher suit card wins
        if (isTrumpCard(card, trump)) {
          winners.push({ index: idx, value: RANK_VALUES[card.rank] + 100 }); // Trump is always higher
        } else if (card.suit === leadSuit && RANK_VALUES[card.rank] > highestSuitValue) {
          winners.push({ index: idx, value: RANK_VALUES[card.rank] });
        }
      }
    }
  }

  if (winners.length === 0) return null;

  // Return lowest winner
  winners.sort((a, b) => a.value - b.value);
  return winners[0].index;
}

/**
 * Get index of lowest-ranked card from given indices.
 */
function getLowestCard(hand: Card[], indices: number[], trump: TrumpInfo): number {
  let lowestIdx = indices[0];
  let lowestValue = Infinity;

  for (const idx of indices) {
    const card = hand[idx];
    let value: number;

    if (isJokerCard(card)) {
      value = 100; // Jokers are high value, avoid dumping
    } else if (isSuitCard(card)) {
      value = RANK_VALUES[card.rank];
      if (isTrumpCard(card, trump)) value += 50; // Avoid dumping trumps
    } else {
      value = 0;
    }

    if (value < lowestValue) {
      lowestValue = value;
      lowestIdx = idx;
    }
  }

  return lowestIdx;
}

/**
 * Lead from the longest non-trump suit with the highest card.
 */
function leadFromLongestSuit(hand: Card[], legalIndices: number[], trump: TrumpInfo): number {
  const suitCounts: Record<string, number[]> = {};

  for (const idx of legalIndices) {
    const card = hand[idx];
    if (isSuitCard(card) && !isTrumpCard(card, trump)) {
      if (!suitCounts[card.suit]) suitCounts[card.suit] = [];
      suitCounts[card.suit].push(idx);
    }
  }

  // Find longest suit
  let longestSuit: number[] = [];
  for (const indices of Object.values(suitCounts)) {
    if (indices.length > longestSuit.length) {
      longestSuit = indices;
    }
  }

  if (longestSuit.length > 0) {
    // Lead highest from longest suit
    let highestIdx = longestSuit[0];
    let highestVal = -1;
    for (const idx of longestSuit) {
      const card = hand[idx];
      if (isSuitCard(card) && RANK_VALUES[card.rank] > highestVal) {
        highestVal = RANK_VALUES[card.rank];
        highestIdx = idx;
      }
    }
    return highestIdx;
  }

  // Fall back to any legal card
  return legalIndices[0];
}

/**
 * Choose Joker mode and suit for AI.
 */
export function chooseJokerPlay(
  hand: Card[],
  trick: Trick,
  trump: TrumpInfo,
  bid: number,
  tricksWon: number,
  difficulty: AIDifficulty
): { mode: 'high' | 'low'; suit?: string } {
  const needsTricks = tricksWon < bid;
  const isLeading = trick.plays.length === 0;

  const mode = needsTricks ? 'high' : 'low';

  if (isLeading) {
    // Choose suit: prefer suit where we have the most cards (for high)
    // or weakest suit (for low)
    const suitCounts: Record<string, number> = { hearts: 0, diamonds: 0, clubs: 0, spades: 0 };
    for (const card of hand) {
      if (isSuitCard(card)) suitCounts[card.suit]++;
    }

    // Remove trump suit from consideration for high Joker
    if (!trump.isNoTrump && trump.suit) {
      if (mode === 'high') {
        // For high Joker, prefer non-trump suit to force others to play their highest
        delete suitCounts[trump.suit];
      }
    }

    const entries = Object.entries(suitCounts);
    if (entries.length === 0) {
      return { mode, suit: 'hearts' };
    }

    if (mode === 'high') {
      // Pick suit where we DON'T have many cards (others likely have more)
      entries.sort((a, b) => a[1] - b[1]);
    } else {
      // For low, pick suit where we have most cards
      entries.sort((a, b) => b[1] - a[1]);
    }

    return { mode, suit: entries[0][0] };
  }

  return { mode };
}
