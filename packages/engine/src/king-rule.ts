import type { HandScore, KingInfo, PlayerIndex, SetNumber, GameSettings } from './types';
import { NUM_PLAYERS } from './constants';

/**
 * Checks which players are "King" candidates — those who have succeeded
 * all their bids in every hand of the current set so far.
 *
 * @param setHandScores - All hand scores for this set so far
 * @returns Array of player indices still on track for King
 */
export function getKingCandidates(setHandScores: HandScore[][]): PlayerIndex[] {
  const candidates: PlayerIndex[] = [0, 1, 2, 3];

  for (const handScores of setHandScores) {
    for (const score of handScores) {
      if (!score.isSuccess) {
        const idx = candidates.indexOf(score.playerIndex);
        if (idx !== -1) candidates.splice(idx, 1);
      }
    }
  }

  return candidates;
}

/**
 * Applies the King rule at the end of a set.
 *
 * King Rule:
 * - Player who succeeds ALL bids in every hand of a set = "King"
 * - Sole King (solo mode): doubles their last hand's score + removes highest
 *   single-hand score from each other player in that set
 * - Sole King (couples mode): doubles last hand score + steals opponent couple's scores
 * - Multiple Kings: each only doubles their last hand score (no removal)
 *
 * @param setHandScores - All hand results for the completed set
 * @param setNumber - Which set just completed
 * @param settings - Game settings (for couples mode)
 * @returns King info and adjusted cumulative scores delta
 */
export function applyKingRule(
  setHandScores: HandScore[][],
  setNumber: SetNumber,
  settings: GameSettings,
  cumulativeScores: number[]
): { kings: KingInfo[]; adjustedScores: number[] } {
  const kings: KingInfo[] = [];
  const adjustedScores = [...cumulativeScores];
  const kingCandidates = getKingCandidates(setHandScores);

  if (kingCandidates.length === 0) {
    return { kings, adjustedScores };
  }

  const isSoleKing = kingCandidates.length === 1;
  const lastHandScores = setHandScores[setHandScores.length - 1];

  for (const kingIdx of kingCandidates) {
    const lastScore = lastHandScores.find(s => s.playerIndex === kingIdx);
    if (!lastScore) continue;

    const doubledScore = lastScore.score; // This amount is ADDED (doubling)
    let removedFromOthers = 0;

    // Double the last hand's score
    adjustedScores[kingIdx] += doubledScore;

    if (isSoleKing) {
      if (settings.couplesMode && settings.couples) {
        // Couples mode: steal opponent couple's scores
        const kingCouple = settings.couples.find(
          c => c.includes(kingIdx.toString()) // Simple check
        );
        // Find opponents (players not in the king's couple)
        const opponents = ([0, 1, 2, 3] as PlayerIndex[]).filter(p => {
          if (kingCouple) {
            return !kingCouple.includes(p.toString());
          }
          return p !== kingIdx;
        });

        for (const oppIdx of opponents) {
          const highestScore = getHighestHandScore(setHandScores, oppIdx);
          removedFromOthers = highestScore;
          adjustedScores[oppIdx] -= highestScore;
        }
      } else {
        // Solo mode: remove highest score from each other player
        for (let p = 0; p < NUM_PLAYERS; p++) {
          if (p === kingIdx) continue;
          const highestScore = getHighestHandScore(setHandScores, p as PlayerIndex);
          removedFromOthers = Math.max(removedFromOthers, highestScore);
          adjustedScores[p] -= highestScore;
        }
      }
    }

    kings.push({
      playerIndex: kingIdx,
      setNumber,
      isSoleKing,
      lastHandScore: lastScore.score,
      doubledScore,
      removedFromOthers,
    });
  }

  return { kings, adjustedScores };
}

/**
 * Gets the highest single-hand score for a player in a set.
 */
function getHighestHandScore(setHandScores: HandScore[][], playerIndex: PlayerIndex): number {
  let highest = 0;
  for (const handScores of setHandScores) {
    const playerScore = handScores.find(s => s.playerIndex === playerIndex);
    if (playerScore && playerScore.score > highest) {
      highest = playerScore.score;
    }
  }
  return highest;
}

/**
 * Updates the "all bids succeeded" tracking for the current set.
 */
export function updateKingTracking(
  allBidsSucceeded: boolean[],
  handScores: HandScore[]
): boolean[] {
  return allBidsSucceeded.map((succeeded, i) => {
    if (!succeeded) return false;
    const score = handScores.find(s => s.playerIndex === i);
    return score ? score.isSuccess : false;
  });
}
