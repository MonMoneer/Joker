import { describe, it, expect } from 'vitest';
import {
  getKingCandidates,
  applyKingRule,
  updateKingTracking,
} from '../src/king-rule';
import type { HandScore, PlayerIndex, GameSettings } from '../src/types';

function makeHandScores(results: { bid: number; won: number; score: number; success: boolean }[]): HandScore[] {
  return results.map((r, i) => ({
    playerIndex: i as PlayerIndex,
    bid: r.bid,
    tricksWon: r.won,
    score: r.score,
    isSuccess: r.success,
    isHistPenalty: false,
    isBidAllWonAll: false,
  }));
}

const soloSettings: GameSettings = {
  histPenalty: false,
  histPenaltyAmount: -200,
  couplesMode: false,
};

describe('getKingCandidates', () => {
  it('all players are candidates when all succeed', () => {
    const setScores = [
      makeHandScores([
        { bid: 1, won: 1, score: 100, success: true },
        { bid: 0, won: 0, score: 50, success: true },
        { bid: 1, won: 1, score: 100, success: true },
        { bid: 0, won: 0, score: 50, success: true },
      ]),
    ];
    expect(getKingCandidates(setScores)).toEqual([0, 1, 2, 3]);
  });

  it('eliminates players who failed any hand', () => {
    const setScores = [
      makeHandScores([
        { bid: 1, won: 1, score: 100, success: true },
        { bid: 1, won: 0, score: 0, success: false }, // Failed!
        { bid: 1, won: 1, score: 100, success: true },
        { bid: 0, won: 0, score: 50, success: true },
      ]),
      makeHandScores([
        { bid: 1, won: 1, score: 100, success: true },
        { bid: 0, won: 0, score: 50, success: true }, // Succeeds this time
        { bid: 2, won: 1, score: 10, success: false }, // Failed!
        { bid: 1, won: 1, score: 100, success: true },
      ]),
    ];
    const candidates = getKingCandidates(setScores);
    expect(candidates).toEqual([0, 3]); // Only players 0 and 3 succeeded everything
  });

  it('returns empty when no candidates', () => {
    const setScores = [
      makeHandScores([
        { bid: 1, won: 0, score: 0, success: false },
        { bid: 1, won: 0, score: 0, success: false },
        { bid: 1, won: 0, score: 0, success: false },
        { bid: 1, won: 1, score: 100, success: true },
      ]),
      makeHandScores([
        { bid: 1, won: 1, score: 100, success: true },
        { bid: 1, won: 1, score: 100, success: true },
        { bid: 1, won: 1, score: 100, success: true },
        { bid: 1, won: 0, score: 0, success: false },
      ]),
    ];
    expect(getKingCandidates(setScores)).toEqual([]);
  });
});

describe('applyKingRule', () => {
  it('sole King doubles last hand score and removes highest from others', () => {
    const setScores = [
      makeHandScores([
        { bid: 1, won: 1, score: 100, success: true },  // P0 success
        { bid: 1, won: 1, score: 100, success: true },  // P1 success
        { bid: 0, won: 0, score: 50, success: true },   // P2 success
        { bid: 0, won: 0, score: 50, success: true },   // P3 success
      ]),
      makeHandScores([
        { bid: 2, won: 2, score: 150, success: true },  // P0 success (highest: 150)
        { bid: 1, won: 0, score: 0, success: false },   // P1 FAILS
        { bid: 1, won: 1, score: 100, success: true },  // P2 success
        { bid: 0, won: 0, score: 50, success: true },   // P3 success
      ]),
    ];
    // Only P0, P2, P3 succeeded all. Wait - P1 failed, so candidates are P0, P2, P3
    // Actually 3 kings means multiple kings — they only double, no removal

    // Let me make a scenario with sole king
    const setScores2 = [
      makeHandScores([
        { bid: 1, won: 1, score: 100, success: true },
        { bid: 1, won: 0, score: 0, success: false },
        { bid: 0, won: 1, score: 10, success: false },
        { bid: 0, won: 0, score: 50, success: true },
      ]),
      makeHandScores([
        { bid: 2, won: 2, score: 150, success: true },  // P0 last hand score: 150
        { bid: 1, won: 1, score: 100, success: true },
        { bid: 1, won: 1, score: 100, success: true },
        { bid: 1, won: 0, score: 0, success: false },
      ]),
    ];

    const cumulative = [250, 100, 110, 50];
    const { kings, adjustedScores } = applyKingRule(setScores2, 1, soloSettings, cumulative);

    expect(kings).toHaveLength(1);
    expect(kings[0].playerIndex).toBe(0);
    expect(kings[0].isSoleKing).toBe(true);
    expect(kings[0].doubledScore).toBe(150);

    // P0 gets +150 (doubled last hand)
    expect(adjustedScores[0]).toBe(250 + 150);

    // Others lose their highest hand score:
    // P1 highest = 100, P2 highest = 100, P3 highest = 50
    expect(adjustedScores[1]).toBe(100 - 100);
    expect(adjustedScores[2]).toBe(110 - 100);
    expect(adjustedScores[3]).toBe(50 - 50);
  });

  it('multiple Kings only double their scores, no removal', () => {
    const setScores = [
      makeHandScores([
        { bid: 1, won: 1, score: 100, success: true },
        { bid: 0, won: 0, score: 50, success: true },
        { bid: 0, won: 0, score: 50, success: true },
        { bid: 0, won: 0, score: 50, success: true },
      ]),
    ];

    // All 4 players succeeded — all are Kings (multiple)
    const cumulative = [100, 50, 50, 50];
    const { kings, adjustedScores } = applyKingRule(setScores, 1, soloSettings, cumulative);

    expect(kings).toHaveLength(4);
    kings.forEach(k => expect(k.isSoleKing).toBe(false));

    // Each doubles their last hand score
    expect(adjustedScores[0]).toBe(100 + 100); // +100
    expect(adjustedScores[1]).toBe(50 + 50);   // +50
    expect(adjustedScores[2]).toBe(50 + 50);   // +50
    expect(adjustedScores[3]).toBe(50 + 50);   // +50
  });

  it('no Kings means no adjustment', () => {
    const setScores = [
      makeHandScores([
        { bid: 1, won: 0, score: 0, success: false },
        { bid: 1, won: 0, score: 0, success: false },
        { bid: 0, won: 1, score: 10, success: false },
        { bid: 0, won: 0, score: 50, success: true },
      ]),
      makeHandScores([
        { bid: 1, won: 1, score: 100, success: true },
        { bid: 1, won: 1, score: 100, success: true },
        { bid: 1, won: 1, score: 100, success: true },
        { bid: 1, won: 0, score: 0, success: false },
      ]),
    ];

    const cumulative = [100, 100, 110, 50];
    const { kings, adjustedScores } = applyKingRule(setScores, 1, soloSettings, cumulative);

    expect(kings).toHaveLength(0);
    expect(adjustedScores).toEqual(cumulative);
  });
});

describe('updateKingTracking', () => {
  it('marks players as failed when they fail a bid', () => {
    const tracking = [true, true, true, true];
    const handScores = makeHandScores([
      { bid: 1, won: 1, score: 100, success: true },
      { bid: 1, won: 0, score: 0, success: false },
      { bid: 0, won: 0, score: 50, success: true },
      { bid: 2, won: 1, score: 10, success: false },
    ]);

    const updated = updateKingTracking(tracking, handScores);
    expect(updated).toEqual([true, false, true, false]);
  });

  it('once failed, stays failed', () => {
    const tracking = [true, false, true, false]; // P1 and P3 already failed
    const handScores = makeHandScores([
      { bid: 1, won: 1, score: 100, success: true },
      { bid: 1, won: 1, score: 100, success: true }, // Succeeds, but already failed
      { bid: 0, won: 0, score: 50, success: true },
      { bid: 0, won: 0, score: 50, success: true },  // Succeeds, but already failed
    ]);

    const updated = updateKingTracking(tracking, handScores);
    expect(updated).toEqual([true, false, true, false]); // P1 and P3 stay failed
  });
});
