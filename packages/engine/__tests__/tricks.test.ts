import { describe, it, expect } from 'vitest';
import {
  getLeadSuit,
  getLegalCardIndices,
  resolveTrick,
  createTrick,
  addPlayToTrick,
  isTrickComplete,
} from '../src/tricks';
import type { Card, TrumpInfo, Trick, TrickPlay, PlayerIndex } from '../src/types';

const trump: TrumpInfo = { suit: 'hearts', isNoTrump: false, card: null };
const noTrump: TrumpInfo = { suit: null, isNoTrump: true, card: null };

function makeTrick(plays: TrickPlay[]): Trick {
  let trick = createTrick();
  for (const play of plays) {
    trick = addPlayToTrick(trick, play);
  }
  return trick;
}

describe('getLeadSuit', () => {
  it('returns suit of first suit card', () => {
    const trick = makeTrick([
      { playerIndex: 0, card: { type: 'suit', suit: 'clubs', rank: 'K' } },
    ]);
    expect(getLeadSuit(trick)).toBe('clubs');
  });

  it('returns declared suit when Joker leads', () => {
    const trick = makeTrick([
      { playerIndex: 0, card: { type: 'joker', id: 1 }, jokerPlay: { mode: 'high', suit: 'spades' } },
    ]);
    expect(getLeadSuit(trick)).toBe('spades');
  });

  it('returns null for empty trick', () => {
    const trick = createTrick();
    expect(getLeadSuit(trick)).toBeNull();
  });
});

describe('getLegalCardIndices', () => {
  it('all cards legal when leading', () => {
    const hand: Card[] = [
      { type: 'suit', suit: 'hearts', rank: 'A' },
      { type: 'suit', suit: 'clubs', rank: 'K' },
      { type: 'joker', id: 1 },
    ];
    const trick = createTrick();
    const legal = getLegalCardIndices(hand, trick, trump);
    expect(legal).toEqual([0, 1, 2]);
  });

  it('must follow suit if possible', () => {
    const hand: Card[] = [
      { type: 'suit', suit: 'clubs', rank: 'A' },
      { type: 'suit', suit: 'clubs', rank: '7' },
      { type: 'suit', suit: 'hearts', rank: 'K' },
      { type: 'suit', suit: 'diamonds', rank: 'Q' },
    ];
    const trick = makeTrick([
      { playerIndex: 0, card: { type: 'suit', suit: 'clubs', rank: 'J' } },
    ]);
    const legal = getLegalCardIndices(hand, trick, trump);
    expect(legal).toEqual([0, 1]); // Only clubs
  });

  it('Joker is always legal even when following suit', () => {
    const hand: Card[] = [
      { type: 'suit', suit: 'clubs', rank: 'A' },
      { type: 'joker', id: 1 },
    ];
    const trick = makeTrick([
      { playerIndex: 0, card: { type: 'suit', suit: 'clubs', rank: 'J' } },
    ]);
    const legal = getLegalCardIndices(hand, trick, trump);
    expect(legal).toEqual([0, 1]); // Club + Joker
  });

  it('must trump if void in led suit', () => {
    const hand: Card[] = [
      { type: 'suit', suit: 'hearts', rank: '9' },  // Trump
      { type: 'suit', suit: 'hearts', rank: '7' },  // Trump
      { type: 'suit', suit: 'diamonds', rank: 'Q' },
    ];
    const trick = makeTrick([
      { playerIndex: 0, card: { type: 'suit', suit: 'clubs', rank: 'J' } },
    ]);
    const legal = getLegalCardIndices(hand, trick, trump); // trump = hearts
    expect(legal).toEqual([0, 1]); // Only trumps (hearts)
  });

  it('any card legal when void in both led suit and trumps', () => {
    const hand: Card[] = [
      { type: 'suit', suit: 'diamonds', rank: 'Q' },
      { type: 'suit', suit: 'spades', rank: 'A' },
    ];
    const trick = makeTrick([
      { playerIndex: 0, card: { type: 'suit', suit: 'clubs', rank: 'J' } },
    ]);
    const legal = getLegalCardIndices(hand, trick, trump); // trump = hearts, led = clubs
    expect(legal).toEqual([0, 1]); // Void in clubs and hearts
  });

  it('high Joker led forces highest card of declared suit', () => {
    const hand: Card[] = [
      { type: 'suit', suit: 'spades', rank: '7' },
      { type: 'suit', suit: 'spades', rank: 'A' },
      { type: 'suit', suit: 'spades', rank: 'K' },
      { type: 'suit', suit: 'hearts', rank: 'Q' },
    ];
    const trick = makeTrick([
      { playerIndex: 0, card: { type: 'joker', id: 1 }, jokerPlay: { mode: 'high', suit: 'spades' } },
    ]);
    const legal = getLegalCardIndices(hand, trick, trump);
    // Must play highest spade (Ace at index 1)
    expect(legal).toEqual([1]);
  });

  it('high Joker led: can play Joker instead of highest card', () => {
    const hand: Card[] = [
      { type: 'suit', suit: 'spades', rank: 'K' },
      { type: 'suit', suit: 'spades', rank: '7' },
      { type: 'joker', id: 2 },
    ];
    const trick = makeTrick([
      { playerIndex: 0, card: { type: 'joker', id: 1 }, jokerPlay: { mode: 'high', suit: 'spades' } },
    ]);
    const legal = getLegalCardIndices(hand, trick, trump);
    // Highest spade (K at index 0) or Joker (index 2)
    expect(legal).toEqual([0, 2]);
  });
});

describe('resolveTrick', () => {
  it('highest card of led suit wins (no trumps played)', () => {
    const trick = makeTrick([
      { playerIndex: 0, card: { type: 'suit', suit: 'clubs', rank: '7' } },
      { playerIndex: 1, card: { type: 'suit', suit: 'clubs', rank: 'K' } },
      { playerIndex: 2, card: { type: 'suit', suit: 'clubs', rank: '9' } },
      { playerIndex: 3, card: { type: 'suit', suit: 'clubs', rank: 'A' } },
    ]);
    expect(resolveTrick(trick, trump)).toBe(3); // Ace wins
  });

  it('trump beats non-trump cards', () => {
    const trick = makeTrick([
      { playerIndex: 0, card: { type: 'suit', suit: 'clubs', rank: 'A' } },
      { playerIndex: 1, card: { type: 'suit', suit: 'hearts', rank: '7' } }, // Trump
      { playerIndex: 2, card: { type: 'suit', suit: 'clubs', rank: 'K' } },
      { playerIndex: 3, card: { type: 'suit', suit: 'clubs', rank: 'Q' } },
    ]);
    expect(resolveTrick(trick, trump)).toBe(1); // 7 of hearts (trump) wins
  });

  it('highest trump wins when multiple trumps played', () => {
    const trick = makeTrick([
      { playerIndex: 0, card: { type: 'suit', suit: 'clubs', rank: 'A' } },
      { playerIndex: 1, card: { type: 'suit', suit: 'hearts', rank: '7' } },  // Trump
      { playerIndex: 2, card: { type: 'suit', suit: 'hearts', rank: 'K' } },  // Trump
      { playerIndex: 3, card: { type: 'suit', suit: 'hearts', rank: '9' } },  // Trump
    ]);
    expect(resolveTrick(trick, trump)).toBe(2); // K of hearts wins
  });

  it('high Joker wins the trick', () => {
    const trick = makeTrick([
      { playerIndex: 0, card: { type: 'joker', id: 1 }, jokerPlay: { mode: 'high', suit: 'clubs' } },
      { playerIndex: 1, card: { type: 'suit', suit: 'clubs', rank: 'A' } },
      { playerIndex: 2, card: { type: 'suit', suit: 'clubs', rank: 'K' } },
      { playerIndex: 3, card: { type: 'suit', suit: 'clubs', rank: 'Q' } },
    ]);
    expect(resolveTrick(trick, trump)).toBe(0); // High Joker wins
  });

  it('high Joker beaten by trump when non-trump suit declared', () => {
    const trick = makeTrick([
      { playerIndex: 0, card: { type: 'joker', id: 1 }, jokerPlay: { mode: 'high', suit: 'clubs' } },
      { playerIndex: 1, card: { type: 'suit', suit: 'clubs', rank: 'A' } },
      { playerIndex: 2, card: { type: 'suit', suit: 'hearts', rank: '7' } }, // Trump!
      { playerIndex: 3, card: { type: 'suit', suit: 'clubs', rank: 'Q' } },
    ]);
    expect(resolveTrick(trick, trump)).toBe(2); // Trump beats high Joker
  });

  it('high Joker NOT beaten by trump when trump suit declared', () => {
    const trick = makeTrick([
      { playerIndex: 0, card: { type: 'joker', id: 1 }, jokerPlay: { mode: 'high', suit: 'hearts' } },
      { playerIndex: 1, card: { type: 'suit', suit: 'hearts', rank: 'A' } },
      { playerIndex: 2, card: { type: 'suit', suit: 'hearts', rank: 'K' } },
      { playerIndex: 3, card: { type: 'suit', suit: 'hearts', rank: 'Q' } },
    ]);
    expect(resolveTrick(trick, trump)).toBe(0); // High Joker wins (declared trump suit)
  });

  it('two high Jokers: second one wins', () => {
    const trick = makeTrick([
      { playerIndex: 0, card: { type: 'joker', id: 1 }, jokerPlay: { mode: 'high', suit: 'clubs' } },
      { playerIndex: 1, card: { type: 'suit', suit: 'clubs', rank: 'A' } },
      { playerIndex: 2, card: { type: 'joker', id: 2 }, jokerPlay: { mode: 'high' } },
      { playerIndex: 3, card: { type: 'suit', suit: 'clubs', rank: 'K' } },
    ]);
    expect(resolveTrick(trick, trump)).toBe(2); // Second high Joker wins
  });

  it('high Joker beats low Joker', () => {
    const trick = makeTrick([
      { playerIndex: 0, card: { type: 'suit', suit: 'clubs', rank: '7' } },
      { playerIndex: 1, card: { type: 'joker', id: 1 }, jokerPlay: { mode: 'high' } },
      { playerIndex: 2, card: { type: 'joker', id: 2 }, jokerPlay: { mode: 'low' } },
      { playerIndex: 3, card: { type: 'suit', suit: 'clubs', rank: 'K' } },
    ]);
    expect(resolveTrick(trick, trump)).toBe(1); // High Joker wins
  });

  it('low Joker loses normally', () => {
    const trick = makeTrick([
      { playerIndex: 0, card: { type: 'suit', suit: 'clubs', rank: '7' } },
      { playerIndex: 1, card: { type: 'joker', id: 1 }, jokerPlay: { mode: 'low' } },
      { playerIndex: 2, card: { type: 'suit', suit: 'clubs', rank: '9' } },
      { playerIndex: 3, card: { type: 'suit', suit: 'clubs', rank: 'K' } },
    ]);
    expect(resolveTrick(trick, trump)).toBe(3); // K wins, low Joker loses
  });

  it('low Joker led wins when no one else plays suit or trump', () => {
    const trick = makeTrick([
      { playerIndex: 0, card: { type: 'joker', id: 1 }, jokerPlay: { mode: 'low', suit: 'diamonds' } },
      { playerIndex: 1, card: { type: 'suit', suit: 'clubs', rank: '9' } },   // Not diamonds
      { playerIndex: 2, card: { type: 'suit', suit: 'spades', rank: 'A' } },  // Not diamonds
      { playerIndex: 3, card: { type: 'suit', suit: 'clubs', rank: 'K' } },   // Not diamonds
    ]);
    // No one played diamonds or trumps (hearts) — low Joker wins
    expect(resolveTrick(trick, noTrump)).toBe(0);
  });

  it('works with no trumps (no trump suit)', () => {
    const trick = makeTrick([
      { playerIndex: 0, card: { type: 'suit', suit: 'clubs', rank: '7' } },
      { playerIndex: 1, card: { type: 'suit', suit: 'clubs', rank: 'A' } },
      { playerIndex: 2, card: { type: 'suit', suit: 'hearts', rank: 'K' } },
      { playerIndex: 3, card: { type: 'suit', suit: 'diamonds', rank: 'A' } },
    ]);
    expect(resolveTrick(trick, noTrump)).toBe(1); // Ace of clubs (led suit) wins
  });
});

describe('trick lifecycle', () => {
  it('createTrick makes empty trick', () => {
    const trick = createTrick();
    expect(trick.plays).toHaveLength(0);
    expect(trick.leadSuit).toBeNull();
  });

  it('addPlayToTrick sets lead suit from first play', () => {
    let trick = createTrick();
    trick = addPlayToTrick(trick, {
      playerIndex: 0,
      card: { type: 'suit', suit: 'diamonds', rank: 'K' },
    });
    expect(trick.leadSuit).toBe('diamonds');
    expect(trick.plays).toHaveLength(1);
  });

  it('isTrickComplete returns true after 4 plays', () => {
    let trick = createTrick();
    expect(isTrickComplete(trick)).toBe(false);

    for (let i = 0; i < 4; i++) {
      trick = addPlayToTrick(trick, {
        playerIndex: i as PlayerIndex,
        card: { type: 'suit', suit: 'clubs', rank: '7' },
      });
    }
    expect(isTrickComplete(trick)).toBe(true);
  });
});
