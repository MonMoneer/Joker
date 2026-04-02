import type { Card, Suit, JokerPlay, JokerMode, TrumpInfo, TrickPlay, Trick, PlayerIndex } from './types';
import { isSuitCard, isJokerCard } from './types';
import { RANK_VALUES } from './constants';

/**
 * Validates a Joker play declaration.
 *
 * @param mode - 'high' or 'low'
 * @param suit - Required when the Joker is leading the trick
 * @param isLeading - Whether this player is leading the trick
 * @returns Error message or null if valid
 */
export function validateJokerPlay(
  mode: JokerMode,
  suit: Suit | undefined,
  isLeading: boolean
): string | null {
  if (mode !== 'high' && mode !== 'low') {
    return `Invalid Joker mode: ${mode}. Must be "high" or "low"`;
  }

  if (isLeading && !suit) {
    return 'When leading with a Joker, you must declare a suit';
  }

  return null;
}

/**
 * Determines which cards a player must play when a HIGH Joker is led.
 *
 * Rule: Each subsequent player must play their HIGHEST card of the declared suit.
 * If they have no cards of that suit, normal void rules apply:
 * - Must trump if possible (or play a Joker)
 * - If void in both, any card is legal
 *
 * @param hand - The player's current hand
 * @param declaredSuit - The suit declared by the Joker leader
 * @param trump - Current trump info
 * @returns Array of legal card indices
 */
export function getLegalCardsForHighJokerLead(
  hand: Card[],
  declaredSuit: Suit,
  trump: TrumpInfo
): number[] {
  // Find cards of declared suit
  const suitCards = hand
    .map((card, i) => ({ card, i }))
    .filter(({ card }) => isSuitCard(card) && card.suit === declaredSuit);

  // Find Joker indices (always legal)
  const jokerIndices = hand
    .map((card, i) => ({ card, i }))
    .filter(({ card }) => isJokerCard(card))
    .map(({ i }) => i);

  if (suitCards.length > 0) {
    // Must play the HIGHEST card of the declared suit
    let highestIdx = suitCards[0].i;
    let highestValue = -1;
    for (const { card, i } of suitCards) {
      if (isSuitCard(card) && RANK_VALUES[card.rank] > highestValue) {
        highestValue = RANK_VALUES[card.rank];
        highestIdx = i;
      }
    }
    // Can play highest of suit OR a Joker
    return [highestIdx, ...jokerIndices];
  }

  // Void in declared suit — must trump if possible
  if (!trump.isNoTrump) {
    const trumpIndices = hand
      .map((card, i) => ({ card, i }))
      .filter(({ card }) => isSuitCard(card) && card.suit === trump.suit)
      .map(({ i }) => i);

    if (trumpIndices.length > 0) {
      return [...trumpIndices, ...jokerIndices];
    }
  }

  // Void in both — any card legal
  return hand.map((_, i) => i);
}

/**
 * Determines if a high Joker in a trick is beaten.
 *
 * A high Joker is beaten when:
 * 1. It declares a non-trump suit AND another player trumps it
 * 2. Another high Joker is played (the second high Joker wins)
 *
 * @returns true if the high Joker loses
 */
export function isHighJokerBeaten(
  jokerPlay: TrickPlay,
  allPlays: TrickPlay[],
  trump: TrumpInfo
): boolean {
  if (!isJokerCard(jokerPlay.card) || jokerPlay.jokerPlay?.mode !== 'high') {
    return false;
  }

  const declaredSuit = jokerPlay.jokerPlay.suit;

  // Check for another high Joker (second one wins)
  const otherHighJokers = allPlays.filter(
    p => p !== jokerPlay &&
         isJokerCard(p.card) &&
         p.jokerPlay?.mode === 'high'
  );
  if (otherHighJokers.length > 0) {
    // The first high Joker is beaten by the second
    const jokerIndex = allPlays.indexOf(jokerPlay);
    const otherIndex = allPlays.indexOf(otherHighJokers[0]);
    return otherIndex > jokerIndex; // First one loses if second exists after it
  }

  // Check if declared a non-trump suit and someone trumped
  if (declaredSuit && !trump.isNoTrump && declaredSuit !== trump.suit) {
    const hasTrumpPlay = allPlays.some(
      p => p !== jokerPlay &&
           isSuitCard(p.card) &&
           p.card.suit === trump.suit
    );
    return hasTrumpPlay;
  }

  return false;
}

/**
 * Checks if a low Joker led wins by default.
 *
 * A low Joker led wins ONLY if:
 * - No other player played the declared suit
 * - No other player played a trump
 * - No other player played a high Joker
 *
 * This is an extremely rare edge case.
 */
export function doesLowJokerWin(
  jokerPlay: TrickPlay,
  allPlays: TrickPlay[],
  trump: TrumpInfo
): boolean {
  if (!isJokerCard(jokerPlay.card) || jokerPlay.jokerPlay?.mode !== 'low') {
    return false;
  }

  const declaredSuit = jokerPlay.jokerPlay.suit;
  const otherPlays = allPlays.filter(p => p !== jokerPlay);

  // Check if anyone played the declared suit
  if (declaredSuit) {
    const hasSuitPlay = otherPlays.some(
      p => isSuitCard(p.card) && p.card.suit === declaredSuit
    );
    if (hasSuitPlay) return false;
  }

  // Check if anyone played a trump
  if (!trump.isNoTrump) {
    const hasTrumpPlay = otherPlays.some(
      p => isSuitCard(p.card) && p.card.suit === trump.suit
    );
    if (hasTrumpPlay) return false;
  }

  // Check if anyone played a high Joker
  const hasHighJoker = otherPlays.some(
    p => isJokerCard(p.card) && p.jokerPlay?.mode === 'high'
  );
  if (hasHighJoker) return false;

  // Low Joker wins by default
  return true;
}

/**
 * Creates a JokerPlay declaration.
 */
export function createJokerPlay(mode: JokerMode, suit?: Suit): JokerPlay {
  return { mode, suit };
}
