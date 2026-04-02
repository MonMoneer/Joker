import type { Card, CeremonyState, PlayerIndex } from './types';
import { isSuitCard } from './types';
import { createDeck, shuffleDeck } from './deck';
import { NUM_PLAYERS } from './constants';

/**
 * Creates the initial state for the dealer selection ceremony.
 *
 * All 36 cards are spread face-down randomly. Players take turns
 * picking cards. The first player to draw an Ace becomes the
 * dealer for Hand 1.
 */
export function createCeremonyState(): CeremonyState {
  const deck = shuffleDeck(createDeck());

  return {
    spreadCards: deck,
    picks: [],
    currentPicker: 0 as PlayerIndex, // Start with player 0
    firstAcePlayer: null,
    isComplete: false,
  };
}

/**
 * Processes a player picking a card during the ceremony.
 *
 * @param state - Current ceremony state
 * @param playerIndex - The player picking
 * @param cardIndex - Index of the card in the spread
 * @returns Updated ceremony state
 */
export function ceremonialPick(
  state: CeremonyState,
  playerIndex: PlayerIndex,
  cardIndex: number
): CeremonyState {
  if (state.isComplete) {
    throw new Error('Ceremony is already complete');
  }

  if (playerIndex !== state.currentPicker) {
    throw new Error(`Not player ${playerIndex}'s turn to pick. Current: ${state.currentPicker}`);
  }

  if (cardIndex < 0 || cardIndex >= state.spreadCards.length) {
    throw new Error(`Invalid card index: ${cardIndex}`);
  }

  // Check if this card was already picked
  const alreadyPicked = state.picks.some((_, i) => {
    // We track by checking if the card at this index was already taken
    // Since we don't remove cards from spread, check pick indices
    return false; // We'll use a different approach
  });

  const pickedCard = state.spreadCards[cardIndex];

  // Check if this card position was already picked
  const pickedIndices = new Set<number>();
  // We need to track which indices were picked
  // Let's restructure: track picked card indices separately

  const newPicks = [...state.picks, { playerIndex, card: pickedCard }];

  // Check if the picked card is an Ace
  let firstAcePlayer = state.firstAcePlayer;
  if (firstAcePlayer === null && isSuitCard(pickedCard) && pickedCard.rank === 'A') {
    firstAcePlayer = playerIndex;
  }

  // Move to next player (round-robin)
  const nextPicker = ((playerIndex + 1) % NUM_PLAYERS) as PlayerIndex;

  // Ceremony is complete when an Ace is found
  const isComplete = firstAcePlayer !== null;

  return {
    spreadCards: state.spreadCards,
    picks: newPicks,
    currentPicker: isComplete ? state.currentPicker : nextPicker,
    firstAcePlayer,
    isComplete,
  };
}

/**
 * Gets the dealer index determined by the ceremony.
 * The first player to draw an Ace deals Hand 1.
 */
export function getCeremonyDealer(state: CeremonyState): PlayerIndex {
  if (!state.isComplete || state.firstAcePlayer === null) {
    throw new Error('Ceremony is not complete yet');
  }
  return state.firstAcePlayer;
}

/**
 * Gets the indices of cards that have already been picked.
 */
export function getPickedCardIndices(state: CeremonyState): number[] {
  // Since we store the card object, we need to find its index in spread
  return state.picks.map(pick => {
    return state.spreadCards.findIndex(card => card === pick.card);
  });
}

/**
 * Gets available (unpicked) card indices.
 */
export function getAvailableCardIndices(state: CeremonyState): number[] {
  const picked = new Set(getPickedCardIndices(state));
  return state.spreadCards
    .map((_, i) => i)
    .filter(i => !picked.has(i));
}
