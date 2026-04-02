import type { Card, SuitCard, Suit, TrumpInfo, TrickPlay, Trick, PlayerIndex, JokerPlay } from './types';
import { isSuitCard, isJokerCard } from './types';
import { RANK_VALUES } from './constants';
import { isTrumpCard } from './trump';

/**
 * Determines the led suit for a trick.
 * - If the first card is a suit card, that's the led suit.
 * - If the first card is a Joker, the declared suit is the led suit.
 */
export function getLeadSuit(trick: Trick): Suit | null {
  if (trick.plays.length === 0) return null;

  const firstPlay = trick.plays[0];
  if (isSuitCard(firstPlay.card)) {
    return firstPlay.card.suit;
  }

  // Joker led: use the declared suit
  if (isJokerCard(firstPlay.card) && firstPlay.jokerPlay?.suit) {
    return firstPlay.jokerPlay.suit;
  }

  return null;
}

/**
 * Determines which cards in a hand are legal to play.
 *
 * Rules:
 * 1. If leading (empty trick): all cards are legal
 * 2. Jokers are ALWAYS legal
 * 3. Must follow led suit if possible
 * 4. If void in led suit, must trump if possible
 * 5. If void in both led suit and trumps, any card is legal
 *
 * Special: If a high Joker was led, must play HIGHEST card of declared suit
 *
 * @returns Array of indices into the hand that are legal plays
 */
export function getLegalCardIndices(
  hand: Card[],
  trick: Trick,
  trump: TrumpInfo
): number[] {
  // Leading: all cards are legal
  if (trick.plays.length === 0) {
    return hand.map((_, i) => i);
  }

  const leadSuit = getLeadSuit(trick);
  if (!leadSuit) return hand.map((_, i) => i);

  // Check if high Joker was led
  const firstPlay = trick.plays[0];
  const isHighJokerLed =
    isJokerCard(firstPlay.card) &&
    firstPlay.jokerPlay?.mode === 'high';

  // Find cards of the led suit in hand
  const ledSuitIndices = hand
    .map((card, i) => ({ card, i }))
    .filter(({ card }) => isSuitCard(card) && card.suit === leadSuit)
    .map(({ i }) => i);

  // Find Joker indices (always legal)
  const jokerIndices = hand
    .map((card, i) => ({ card, i }))
    .filter(({ card }) => isJokerCard(card))
    .map(({ i }) => i);

  // Find trump card indices (excluding led suit if it IS trump)
  const trumpIndices = hand
    .map((card, i) => ({ card, i }))
    .filter(({ card }) => isSuitCard(card) && isTrumpCard(card, trump) && card.suit !== leadSuit)
    .map(({ i }) => i);

  if (ledSuitIndices.length > 0) {
    if (isHighJokerLed) {
      // Must play HIGHEST card of led suit (or Joker)
      const highestIdx = getHighestCardIndex(hand, ledSuitIndices);
      return [highestIdx, ...jokerIndices];
    }
    // Must follow suit (or play Joker)
    return [...ledSuitIndices, ...jokerIndices];
  }

  // Void in led suit
  if (trumpIndices.length > 0 && !trump.isNoTrump) {
    // Must trump (or play Joker)
    return [...trumpIndices, ...jokerIndices];
  }

  // Void in both led suit and trumps: any card is legal
  return hand.map((_, i) => i);
}

/**
 * Gets the index of the highest card among specific indices in a hand.
 */
function getHighestCardIndex(hand: Card[], indices: number[]): number {
  let highestIdx = indices[0];
  let highestValue = -1;

  for (const idx of indices) {
    const card = hand[idx];
    if (isSuitCard(card)) {
      const value = RANK_VALUES[card.rank];
      if (value > highestValue) {
        highestValue = value;
        highestIdx = idx;
      }
    }
  }

  return highestIdx;
}

/**
 * Resolves who wins a completed trick.
 *
 * Priority:
 * 1. High Joker (with special cases for being beaten by trump or second high Joker)
 * 2. Highest trump card
 * 3. Highest card of led suit
 * 4. Low Joker wins only if no one else played led suit, trumps, or high Joker
 *
 * Two Jokers in same trick:
 * - Both high: second one wins
 * - High vs low: high wins
 */
export function resolveTrick(trick: Trick, trump: TrumpInfo): PlayerIndex {
  const plays = trick.plays;
  if (plays.length === 0) throw new Error('Cannot resolve empty trick');

  const leadSuit = getLeadSuit(trick);

  // Find all high Jokers and low Jokers
  const highJokers = plays.filter(
    p => isJokerCard(p.card) && p.jokerPlay?.mode === 'high'
  );
  const lowJokers = plays.filter(
    p => isJokerCard(p.card) && p.jokerPlay?.mode === 'low'
  );

  // Case: Two high Jokers — second one wins
  if (highJokers.length === 2) {
    return highJokers[1].playerIndex;
  }

  // Case: One high Joker
  if (highJokers.length === 1) {
    const highJokerPlay = highJokers[0];
    const jokerDeclaredSuit = highJokerPlay.jokerPlay!.suit;

    // High Joker can be beaten by trump IF it declared a non-trump suit
    if (jokerDeclaredSuit && !trump.isNoTrump && jokerDeclaredSuit !== trump.suit) {
      // Check if anyone played a trump
      const trumpPlays = plays.filter(
        p => isSuitCard(p.card) && isTrumpCard(p.card, trump)
      );
      if (trumpPlays.length > 0) {
        // Highest trump wins (beats the Joker)
        return getHighestTrickPlay(trumpPlays, trump);
      }
    }

    // High Joker wins
    return highJokerPlay.playerIndex;
  }

  // No high Jokers — check for trumps
  const trumpPlays = plays.filter(
    p => isSuitCard(p.card) && isTrumpCard(p.card, trump)
  );
  if (trumpPlays.length > 0) {
    return getHighestTrickPlay(trumpPlays, trump);
  }

  // No trumps — highest card of led suit wins
  if (leadSuit) {
    const ledSuitPlays = plays.filter(
      p => isSuitCard(p.card) && p.card.suit === leadSuit
    );
    if (ledSuitPlays.length > 0) {
      return getHighestTrickPlay(ledSuitPlays, trump);
    }
  }

  // Edge case: Low Joker led and nobody played the suit or trumps
  if (lowJokers.length > 0) {
    // The low Joker that was led wins by default
    return lowJokers[0].playerIndex;
  }

  // Fallback (should never happen in valid play)
  return plays[0].playerIndex;
}

/**
 * Gets the player index with the highest suit card among the given plays.
 */
function getHighestTrickPlay(plays: TrickPlay[], trump: TrumpInfo): PlayerIndex {
  let winner = plays[0];
  let highestValue = -1;

  for (const play of plays) {
    if (isSuitCard(play.card)) {
      const value = RANK_VALUES[play.card.rank];
      if (value > highestValue) {
        highestValue = value;
        winner = play;
      }
    }
  }

  return winner.playerIndex;
}

/**
 * Creates an empty trick.
 */
export function createTrick(): Trick {
  return {
    plays: [],
    leadSuit: null,
  };
}

/**
 * Adds a play to a trick and updates the lead suit.
 */
export function addPlayToTrick(trick: Trick, play: TrickPlay): Trick {
  const newPlays = [...trick.plays, play];
  let leadSuit = trick.leadSuit;

  // Set lead suit from first play
  if (newPlays.length === 1) {
    if (isSuitCard(play.card)) {
      leadSuit = play.card.suit;
    } else if (isJokerCard(play.card) && play.jokerPlay?.suit) {
      leadSuit = play.jokerPlay.suit;
    }
  }

  return { plays: newPlays, leadSuit };
}

/**
 * Checks if a trick is complete (all 4 players have played).
 */
export function isTrickComplete(trick: Trick): boolean {
  return trick.plays.length === 4;
}
