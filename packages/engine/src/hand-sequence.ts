import type { HandConfig, SetNumber, PlayerIndex } from './types';
import { generateHandSequence, SET_CONFIGS, TOTAL_HANDS, NUM_PLAYERS } from './constants';

// Cached hand sequence (always the same 24 hands)
let _handSequence: HandConfig[] | null = null;

/**
 * Returns the full 24-hand sequence for a Georgian Joker game.
 * Cached after first call.
 */
export function getHandSequence(): HandConfig[] {
  if (!_handSequence) {
    _handSequence = generateHandSequence();
  }
  return _handSequence;
}

/**
 * Gets the hand config for a specific hand number (1-24).
 */
export function getHandConfig(handNumber: number): HandConfig {
  if (handNumber < 1 || handNumber > TOTAL_HANDS) {
    throw new Error(`Hand number must be between 1 and ${TOTAL_HANDS}, got ${handNumber}`);
  }
  return getHandSequence()[handNumber - 1];
}

/**
 * Returns which set a given hand belongs to.
 */
export function getSetForHand(handNumber: number): SetNumber {
  return getHandConfig(handNumber).setNumber;
}

/**
 * Returns the first hand number in a given set.
 */
export function getFirstHandInSet(setNumber: SetNumber): number {
  const sequence = getHandSequence();
  const hand = sequence.find(h => h.setNumber === setNumber);
  if (!hand) throw new Error(`Invalid set number: ${setNumber}`);
  return hand.handNumber;
}

/**
 * Returns the last hand number in a given set.
 */
export function getLastHandInSet(setNumber: SetNumber): number {
  const sequence = getHandSequence();
  const handsInSet = sequence.filter(h => h.setNumber === setNumber);
  return handsInSet[handsInSet.length - 1].handNumber;
}

/**
 * Returns all hand configs for a given set.
 */
export function getHandsInSet(setNumber: SetNumber): HandConfig[] {
  return getHandSequence().filter(h => h.setNumber === setNumber);
}

/**
 * Checks if a hand is the last hand in its set.
 */
export function isLastHandInSet(handNumber: number): boolean {
  return handNumber === getLastHandInSet(getSetForHand(handNumber));
}

/**
 * Checks if a hand is the very last hand of the game.
 */
export function isGameOver(handNumber: number): boolean {
  return handNumber === TOTAL_HANDS;
}

/**
 * Gets the dealer index for a given hand.
 * Dealer rotates clockwise each hand.
 *
 * @param handNumber - The current hand number (1-24)
 * @param firstDealer - The player who deals Hand 1 (determined by ceremony)
 */
export function getDealerForHand(handNumber: number, firstDealer: PlayerIndex): PlayerIndex {
  return ((firstDealer + handNumber - 1) % NUM_PLAYERS) as PlayerIndex;
}

/**
 * Gets the player index who bids/leads first (player to dealer's left).
 */
export function getFirstPlayer(dealerIndex: PlayerIndex): PlayerIndex {
  return ((dealerIndex + 1) % NUM_PLAYERS) as PlayerIndex;
}

/**
 * Determines if a hand uses a separate trump card (Sets 1 & 3)
 * or if the dealer's last card is the trump (Sets 2 & 4).
 */
export function usesSeparateTrumpCard(handConfig: HandConfig): boolean {
  return handConfig.setNumber === 1 || handConfig.setNumber === 3;
}
