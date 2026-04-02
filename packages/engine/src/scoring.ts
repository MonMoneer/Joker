import type { HandScore, PlayerIndex, GameSettings, SetNumber } from './types';
import { SCORING, NUM_PLAYERS } from './constants';

/**
 * Calculates the score for a single player in a single hand.
 *
 * Scoring rules:
 * - Bid X (≥1), won exactly X: X × 50 + 50
 * - Bid 0 (pass), won 0 tricks: 50
 * - Bid ALL tricks and won ALL: X × 100 (double reward)
 * - Failed bid: tricks_won × 10
 * - Hist Penalty: bid ≥1 but win 0 → configurable -200 or -500 (flat for all sets)
 */
export function calculateHandScore(
  bid: number,
  tricksWon: number,
  cardsPerPlayer: number,
  settings: GameSettings
): number {
  // Successful bid of 0 (pass)
  if (bid === 0 && tricksWon === 0) {
    return SCORING.PASS_SUCCESS;
  }

  // Successful bid — won exactly what was bid
  if (bid === tricksWon) {
    // Special: bid all tricks and won all
    if (bid === cardsPerPlayer) {
      return bid * SCORING.BID_ALL_MULTIPLIER;
    }
    return bid * SCORING.SUCCESS_MULTIPLIER + SCORING.SUCCESS_BONUS;
  }

  // Failed bid
  // Check for hist penalty: bid ≥1 but won 0 tricks
  if (settings.histPenalty && bid >= 1 && tricksWon === 0) {
    return settings.histPenaltyAmount; // -200 or -500
  }

  // Normal failure: tricks won × 10
  return tricksWon * SCORING.FAIL_PER_TRICK;
}

/**
 * Calculates scores for all 4 players in a hand.
 */
export function calculateAllHandScores(
  bids: number[],
  tricksWon: number[],
  cardsPerPlayer: number,
  settings: GameSettings
): HandScore[] {
  return bids.map((bid, i) => {
    const score = calculateHandScore(bid, tricksWon[i], cardsPerPlayer, settings);
    const isSuccess = (bid === 0 && tricksWon[i] === 0) || (bid > 0 && bid === tricksWon[i]);
    const isHistPenalty = settings.histPenalty && bid >= 1 && tricksWon[i] === 0;
    const isBidAllWonAll = bid === cardsPerPlayer && tricksWon[i] === cardsPerPlayer;

    return {
      playerIndex: i as PlayerIndex,
      bid,
      tricksWon: tricksWon[i],
      score,
      isSuccess,
      isHistPenalty,
      isBidAllWonAll,
    };
  });
}

/**
 * Validates that tricks won sum to the correct total.
 * In a valid hand, total tricks must equal cards per player.
 */
export function validateTricksTotal(
  tricksWon: number[],
  cardsPerPlayer: number
): string | null {
  const total = tricksWon.reduce((sum, t) => sum + t, 0);
  if (total !== cardsPerPlayer) {
    return `Total tricks won (${total}) does not equal cards dealt (${cardsPerPlayer})`;
  }
  return null;
}

/**
 * Updates cumulative scores with new hand scores.
 */
export function addHandScoresToCumulative(
  currentScores: number[],
  handScores: HandScore[]
): number[] {
  return currentScores.map((score, i) => score + handScores[i].score);
}
