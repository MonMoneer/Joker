import { describe, it, expect } from 'vitest';
import {
  calculateHandScore,
  calculateAllHandScores,
  validateTricksTotal,
  addHandScoresToCumulative,
} from '../src/scoring';
import type { GameSettings } from '../src/types';

const defaultSettings: GameSettings = {
  histPenalty: false,
  histPenaltyAmount: -200,
  couplesMode: false,
};

const histSettings200: GameSettings = {
  histPenalty: true,
  histPenaltyAmount: -200,
  couplesMode: false,
};

const histSettings500: GameSettings = {
  histPenalty: true,
  histPenaltyAmount: -500,
  couplesMode: false,
};

describe('calculateHandScore', () => {
  it('bid 0, won 0 = 50 points', () => {
    expect(calculateHandScore(0, 0, 5, defaultSettings)).toBe(50);
  });

  it('bid 1, won 1 = 1×50+50 = 100', () => {
    expect(calculateHandScore(1, 1, 5, defaultSettings)).toBe(100);
  });

  it('bid 3, won 3 = 3×50+50 = 200', () => {
    expect(calculateHandScore(3, 3, 5, defaultSettings)).toBe(200);
  });

  it('bid 5, won 5 = 5×50+50 = 300', () => {
    expect(calculateHandScore(5, 5, 9, defaultSettings)).toBe(300);
  });

  it('bid ALL (9) and won ALL = 9×100 = 900', () => {
    expect(calculateHandScore(9, 9, 9, defaultSettings)).toBe(900);
  });

  it('bid ALL (1 card hand) and won ALL = 1×100 = 100', () => {
    expect(calculateHandScore(1, 1, 1, defaultSettings)).toBe(100);
  });

  it('failed bid: bid 3 won 2 = 2×10 = 20', () => {
    expect(calculateHandScore(3, 2, 5, defaultSettings)).toBe(20);
  });

  it('failed bid: bid 3 won 0 = 0 (no hist penalty)', () => {
    expect(calculateHandScore(3, 0, 5, defaultSettings)).toBe(0);
  });

  it('failed bid: bid 0 won 2 = 2×10 = 20', () => {
    expect(calculateHandScore(0, 2, 5, defaultSettings)).toBe(20);
  });

  it('hist penalty -200: bid 3 won 0', () => {
    expect(calculateHandScore(3, 0, 5, histSettings200)).toBe(-200);
  });

  it('hist penalty -500: bid 1 won 0', () => {
    expect(calculateHandScore(1, 0, 9, histSettings500)).toBe(-500);
  });

  it('hist penalty only applies when bid >= 1 and won 0', () => {
    // Bid 0 and won 0 still gets 50 (pass success)
    expect(calculateHandScore(0, 0, 5, histSettings200)).toBe(50);
    // Bid 2 and won 1 is normal failure, not hist
    expect(calculateHandScore(2, 1, 5, histSettings200)).toBe(10);
  });

  it('hist penalty: bid 2 won 0 in -200 mode', () => {
    expect(calculateHandScore(2, 0, 5, histSettings200)).toBe(-200);
  });

  it('hist penalty: bid 9 won 0 in -500 mode', () => {
    expect(calculateHandScore(9, 0, 9, histSettings500)).toBe(-500);
  });
});

describe('calculateAllHandScores', () => {
  it('calculates scores for all 4 players', () => {
    const bids = [2, 0, 3, 1];
    const tricks = [2, 0, 2, 1]; // Player 2 fails
    const scores = calculateAllHandScores(bids, tricks, 5, defaultSettings);

    expect(scores).toHaveLength(4);
    expect(scores[0].score).toBe(150); // 2×50+50
    expect(scores[0].isSuccess).toBe(true);
    expect(scores[1].score).toBe(50);  // pass success
    expect(scores[1].isSuccess).toBe(true);
    expect(scores[2].score).toBe(20);  // 2×10 (failed)
    expect(scores[2].isSuccess).toBe(false);
    expect(scores[3].score).toBe(100); // 1×50+50
    expect(scores[3].isSuccess).toBe(true);
  });

  it('detects bid-all-won-all', () => {
    const bids = [9, 0, 0, 0];
    const tricks = [9, 0, 0, 0];
    const scores = calculateAllHandScores(bids, tricks, 9, defaultSettings);

    expect(scores[0].score).toBe(900);
    expect(scores[0].isBidAllWonAll).toBe(true);
  });

  it('detects hist penalty', () => {
    const bids = [3, 0, 2, 1];
    const tricks = [0, 0, 3, 2]; // Player 0 and 3 fail
    const scores = calculateAllHandScores(bids, tricks, 5, histSettings200);

    expect(scores[0].score).toBe(-200);
    expect(scores[0].isHistPenalty).toBe(true);
    expect(scores[3].score).toBe(20); // Won 2, not 0, so normal failure
    expect(scores[3].isHistPenalty).toBe(false);
  });
});

describe('validateTricksTotal', () => {
  it('returns null when total equals cards dealt', () => {
    expect(validateTricksTotal([2, 1, 1, 1], 5)).toBeNull();
  });

  it('returns error when total does not match', () => {
    const err = validateTricksTotal([2, 2, 2, 2], 5);
    expect(err).toBeTruthy();
  });

  it('validates 9-card hand', () => {
    expect(validateTricksTotal([3, 2, 2, 2], 9)).toBeNull();
  });

  it('validates 1-card hand', () => {
    expect(validateTricksTotal([1, 0, 0, 0], 1)).toBeNull();
  });
});

describe('addHandScoresToCumulative', () => {
  it('adds scores correctly', () => {
    const current = [100, 200, 50, 300];
    const handScores = calculateAllHandScores([2, 0, 1, 3], [2, 0, 1, 3], 5, defaultSettings);
    const updated = addHandScoresToCumulative(current, handScores);

    expect(updated[0]).toBe(100 + 150); // 2×50+50
    expect(updated[1]).toBe(200 + 50);  // pass
    expect(updated[2]).toBe(50 + 100);  // 1×50+50
    expect(updated[3]).toBe(300 + 200); // 3×50+50
  });
});
