import { describe, it, expect } from 'vitest';
import {
  getHandSequence,
  getHandConfig,
  getSetForHand,
  getFirstHandInSet,
  getLastHandInSet,
  getHandsInSet,
  isLastHandInSet,
  isGameOver,
  getDealerForHand,
  getFirstPlayer,
  usesSeparateTrumpCard,
} from '../src/hand-sequence';
import { TOTAL_HANDS } from '../src/constants';
import type { PlayerIndex } from '../src/types';

describe('getHandSequence', () => {
  const sequence = getHandSequence();

  it('returns exactly 24 hands', () => {
    expect(sequence).toHaveLength(TOTAL_HANDS);
  });

  it('hands are numbered 1 through 24', () => {
    sequence.forEach((hand, i) => {
      expect(hand.handNumber).toBe(i + 1);
    });
  });

  it('Set 1 has ascending card counts 1-8', () => {
    const set1 = sequence.filter(h => h.setNumber === 1);
    expect(set1).toHaveLength(8);
    expect(set1.map(h => h.cardsPerPlayer)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('Set 2 has four hands of 9 cards', () => {
    const set2 = sequence.filter(h => h.setNumber === 2);
    expect(set2).toHaveLength(4);
    expect(set2.map(h => h.cardsPerPlayer)).toEqual([9, 9, 9, 9]);
  });

  it('Set 3 has descending card counts 8-1', () => {
    const set3 = sequence.filter(h => h.setNumber === 3);
    expect(set3).toHaveLength(8);
    expect(set3.map(h => h.cardsPerPlayer)).toEqual([8, 7, 6, 5, 4, 3, 2, 1]);
  });

  it('Set 4 has four hands of 9 cards', () => {
    const set4 = sequence.filter(h => h.setNumber === 4);
    expect(set4).toHaveLength(4);
    expect(set4.map(h => h.cardsPerPlayer)).toEqual([9, 9, 9, 9]);
  });

  it('sets appear in order: 1, 2, 3, 4', () => {
    const setOrder = sequence.map(h => h.setNumber);
    const uniqueOrder: number[] = [];
    for (const s of setOrder) {
      if (uniqueOrder[uniqueOrder.length - 1] !== s) uniqueOrder.push(s);
    }
    expect(uniqueOrder).toEqual([1, 2, 3, 4]);
  });

  it('handInSet is correct for each hand', () => {
    let expectedHandInSet = 1;
    let currentSet = 1;
    for (const hand of sequence) {
      if (hand.setNumber !== currentSet) {
        expectedHandInSet = 1;
        currentSet = hand.setNumber;
      }
      expect(hand.handInSet).toBe(expectedHandInSet);
      expectedHandInSet++;
    }
  });
});

describe('getHandConfig', () => {
  it('returns correct config for hand 1', () => {
    const config = getHandConfig(1);
    expect(config.setNumber).toBe(1);
    expect(config.cardsPerPlayer).toBe(1);
    expect(config.handInSet).toBe(1);
  });

  it('returns correct config for hand 12 (last hand of set 2)', () => {
    const config = getHandConfig(12);
    expect(config.setNumber).toBe(2);
    expect(config.cardsPerPlayer).toBe(9);
    expect(config.handInSet).toBe(4);
  });

  it('returns correct config for hand 24 (last hand)', () => {
    const config = getHandConfig(24);
    expect(config.setNumber).toBe(4);
    expect(config.cardsPerPlayer).toBe(9);
    expect(config.handInSet).toBe(4);
  });

  it('throws for invalid hand numbers', () => {
    expect(() => getHandConfig(0)).toThrow();
    expect(() => getHandConfig(25)).toThrow();
    expect(() => getHandConfig(-1)).toThrow();
  });
});

describe('getSetForHand', () => {
  it('hands 1-8 are in set 1', () => {
    for (let i = 1; i <= 8; i++) {
      expect(getSetForHand(i)).toBe(1);
    }
  });

  it('hands 9-12 are in set 2', () => {
    for (let i = 9; i <= 12; i++) {
      expect(getSetForHand(i)).toBe(2);
    }
  });

  it('hands 13-20 are in set 3', () => {
    for (let i = 13; i <= 20; i++) {
      expect(getSetForHand(i)).toBe(3);
    }
  });

  it('hands 21-24 are in set 4', () => {
    for (let i = 21; i <= 24; i++) {
      expect(getSetForHand(i)).toBe(4);
    }
  });
});

describe('set boundary helpers', () => {
  it('getFirstHandInSet returns correct first hands', () => {
    expect(getFirstHandInSet(1)).toBe(1);
    expect(getFirstHandInSet(2)).toBe(9);
    expect(getFirstHandInSet(3)).toBe(13);
    expect(getFirstHandInSet(4)).toBe(21);
  });

  it('getLastHandInSet returns correct last hands', () => {
    expect(getLastHandInSet(1)).toBe(8);
    expect(getLastHandInSet(2)).toBe(12);
    expect(getLastHandInSet(3)).toBe(20);
    expect(getLastHandInSet(4)).toBe(24);
  });

  it('getHandsInSet returns correct count', () => {
    expect(getHandsInSet(1)).toHaveLength(8);
    expect(getHandsInSet(2)).toHaveLength(4);
    expect(getHandsInSet(3)).toHaveLength(8);
    expect(getHandsInSet(4)).toHaveLength(4);
  });

  it('isLastHandInSet correctly identifies last hands', () => {
    expect(isLastHandInSet(8)).toBe(true);
    expect(isLastHandInSet(7)).toBe(false);
    expect(isLastHandInSet(12)).toBe(true);
    expect(isLastHandInSet(11)).toBe(false);
    expect(isLastHandInSet(20)).toBe(true);
    expect(isLastHandInSet(24)).toBe(true);
  });

  it('isGameOver only for hand 24', () => {
    expect(isGameOver(24)).toBe(true);
    expect(isGameOver(23)).toBe(false);
    expect(isGameOver(1)).toBe(false);
  });
});

describe('getDealerForHand', () => {
  it('first dealer deals hand 1', () => {
    expect(getDealerForHand(1, 0 as PlayerIndex)).toBe(0);
    expect(getDealerForHand(1, 2 as PlayerIndex)).toBe(2);
  });

  it('dealer rotates clockwise each hand', () => {
    expect(getDealerForHand(1, 0 as PlayerIndex)).toBe(0);
    expect(getDealerForHand(2, 0 as PlayerIndex)).toBe(1);
    expect(getDealerForHand(3, 0 as PlayerIndex)).toBe(2);
    expect(getDealerForHand(4, 0 as PlayerIndex)).toBe(3);
    expect(getDealerForHand(5, 0 as PlayerIndex)).toBe(0); // wraps
  });

  it('works with non-zero first dealer', () => {
    expect(getDealerForHand(1, 3 as PlayerIndex)).toBe(3);
    expect(getDealerForHand(2, 3 as PlayerIndex)).toBe(0);
    expect(getDealerForHand(3, 3 as PlayerIndex)).toBe(1);
  });
});

describe('getFirstPlayer', () => {
  it('returns player to dealers left', () => {
    expect(getFirstPlayer(0 as PlayerIndex)).toBe(1);
    expect(getFirstPlayer(1 as PlayerIndex)).toBe(2);
    expect(getFirstPlayer(2 as PlayerIndex)).toBe(3);
    expect(getFirstPlayer(3 as PlayerIndex)).toBe(0);
  });
});

describe('usesSeparateTrumpCard', () => {
  it('sets 1 and 3 use separate trump card', () => {
    expect(usesSeparateTrumpCard(getHandConfig(1))).toBe(true);   // Set 1
    expect(usesSeparateTrumpCard(getHandConfig(8))).toBe(true);   // Set 1
    expect(usesSeparateTrumpCard(getHandConfig(13))).toBe(true);  // Set 3
    expect(usesSeparateTrumpCard(getHandConfig(20))).toBe(true);  // Set 3
  });

  it('sets 2 and 4 use dealers last card', () => {
    expect(usesSeparateTrumpCard(getHandConfig(9))).toBe(false);  // Set 2
    expect(usesSeparateTrumpCard(getHandConfig(12))).toBe(false); // Set 2
    expect(usesSeparateTrumpCard(getHandConfig(21))).toBe(false); // Set 4
    expect(usesSeparateTrumpCard(getHandConfig(24))).toBe(false); // Set 4
  });
});
