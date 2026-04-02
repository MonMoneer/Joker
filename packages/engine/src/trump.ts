import type { Card, TrumpInfo, HandConfig, PlayerIndex } from './types';
import { isJokerCard, isSuitCard } from './types';
import { usesSeparateTrumpCard } from './hand-sequence';

/**
 * Determines the trump for a hand.
 *
 * Sets 1 & 3 (partial deal): Turn the next card from remaining deck face-up.
 *   - If it's a suit card, that suit is trump.
 *   - If it's a Joker, the hand is played with no trumps.
 *
 * Sets 2 & 4 (full deal, 9 cards each): The dealer's last (9th) card is
 *   dealt face-up as the trump indicator.
 *   - If it's a suit card, that suit is trump.
 *   - If it's a Joker, the hand is played with no trumps.
 *
 * @param handConfig - The current hand configuration
 * @param remainingDeck - Cards remaining after dealing (Sets 1 & 3)
 * @param dealerHand - The dealer's hand (Sets 2 & 4, for last card)
 * @returns TrumpInfo with the trump suit and indicator card
 */
export function determineTrump(
  handConfig: HandConfig,
  remainingDeck: Card[],
  dealerHand: Card[]
): TrumpInfo {
  let trumpCard: Card;

  if (usesSeparateTrumpCard(handConfig)) {
    // Sets 1 & 3: take the top card from remaining deck
    if (remainingDeck.length === 0) {
      throw new Error('No remaining cards to determine trump');
    }
    trumpCard = remainingDeck[0];
  } else {
    // Sets 2 & 4: dealer's last card (the 9th card dealt)
    if (dealerHand.length === 0) {
      throw new Error('Dealer hand is empty, cannot determine trump');
    }
    trumpCard = dealerHand[dealerHand.length - 1];
  }

  return trumpFromCard(trumpCard);
}

/**
 * Converts a trump indicator card to TrumpInfo.
 */
export function trumpFromCard(card: Card): TrumpInfo {
  if (isJokerCard(card)) {
    return {
      suit: null,
      isNoTrump: true,
      card,
    };
  }

  return {
    suit: card.suit,
    isNoTrump: false,
    card,
  };
}

/**
 * Checks if a given suit is the trump suit.
 */
export function isTrumpSuit(suit: string, trump: TrumpInfo): boolean {
  if (trump.isNoTrump) return false;
  return suit === trump.suit;
}

/**
 * Checks if a card is a trump card.
 */
export function isTrumpCard(card: Card, trump: TrumpInfo): boolean {
  if (isJokerCard(card)) return false; // Jokers are special, not "trumps"
  if (trump.isNoTrump) return false;
  return card.suit === trump.suit;
}
