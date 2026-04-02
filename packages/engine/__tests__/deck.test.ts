import { describe, it, expect } from 'vitest';
import { createDeck, shuffleDeck, dealCards, sortHand } from '../src/deck';
import { DECK_SIZE } from '../src/constants';
import type { Card, SuitCard, JokerCard } from '../src/types';
import { isSuitCard, isJokerCard } from '../src/types';

describe('createDeck', () => {
  const deck = createDeck();

  it('creates exactly 36 cards', () => {
    expect(deck).toHaveLength(DECK_SIZE);
  });

  it('contains exactly 2 Jokers', () => {
    const jokers = deck.filter(isJokerCard);
    expect(jokers).toHaveLength(2);
    expect(jokers[0].id).toBe(1);
    expect(jokers[1].id).toBe(2);
  });

  it('contains 34 suit cards', () => {
    const suitCards = deck.filter(isSuitCard);
    expect(suitCards).toHaveLength(34);
  });

  it('has 9 hearts cards (including 6)', () => {
    const hearts = deck.filter(c => isSuitCard(c) && c.suit === 'hearts') as SuitCard[];
    expect(hearts).toHaveLength(9);
    expect(hearts.some(c => c.rank === '6')).toBe(true);
  });

  it('has 9 diamonds cards (including 6)', () => {
    const diamonds = deck.filter(c => isSuitCard(c) && c.suit === 'diamonds') as SuitCard[];
    expect(diamonds).toHaveLength(9);
    expect(diamonds.some(c => c.rank === '6')).toBe(true);
  });

  it('has 8 clubs cards (no 6)', () => {
    const clubs = deck.filter(c => isSuitCard(c) && c.suit === 'clubs') as SuitCard[];
    expect(clubs).toHaveLength(8);
    expect(clubs.some(c => c.rank === '6')).toBe(false);
  });

  it('has 8 spades cards (no 6)', () => {
    const spades = deck.filter(c => isSuitCard(c) && c.suit === 'spades') as SuitCard[];
    expect(spades).toHaveLength(8);
    expect(spades.some(c => c.rank === '6')).toBe(false);
  });

  it('has no duplicate cards', () => {
    const serialized = deck.map(c => {
      if (isJokerCard(c)) return `joker-${c.id}`;
      return `${c.suit}-${c.rank}`;
    });
    const unique = new Set(serialized);
    expect(unique.size).toBe(deck.length);
  });

  it('contains all expected ranks for each suit', () => {
    const expectedRanks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7'];
    for (const suit of ['hearts', 'diamonds', 'clubs', 'spades'] as const) {
      for (const rank of expectedRanks) {
        const found = deck.find(c => isSuitCard(c) && c.suit === suit && c.rank === rank);
        expect(found, `${rank} of ${suit} should exist`).toBeDefined();
      }
    }
  });
});

describe('shuffleDeck', () => {
  it('returns a deck of the same length', () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    expect(shuffled).toHaveLength(deck.length);
  });

  it('does not mutate the original deck', () => {
    const deck = createDeck();
    const original = [...deck];
    shuffleDeck(deck);
    expect(deck).toEqual(original);
  });

  it('contains the same cards (just reordered)', () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);

    const serialize = (c: Card) =>
      isJokerCard(c) ? `joker-${c.id}` : `${c.suit}-${c.rank}`;

    const deckSet = new Set(deck.map(serialize));
    const shuffledSet = new Set(shuffled.map(serialize));
    expect(shuffledSet).toEqual(deckSet);
  });

  it('produces different orders (statistical, may rarely fail)', () => {
    const deck = createDeck();
    const shuffled1 = shuffleDeck(deck);
    const shuffled2 = shuffleDeck(deck);
    // At least one of the shuffles should differ from original
    const allSame = deck.every((c, i) => {
      const s = shuffled1[i];
      if (c.type !== s.type) return false;
      if (isJokerCard(c) && isJokerCard(s)) return c.id === s.id;
      if (isSuitCard(c) && isSuitCard(s)) return c.suit === s.suit && c.rank === s.rank;
      return false;
    });
    // Very unlikely both shuffles match original
    expect(allSame && deck.every((c, i) => {
      const s = shuffled2[i];
      if (c.type !== s.type) return false;
      if (isJokerCard(c) && isJokerCard(s)) return c.id === s.id;
      if (isSuitCard(c) && isSuitCard(s)) return c.suit === s.suit && c.rank === s.rank;
      return false;
    })).toBe(false);
  });
});

describe('dealCards', () => {
  it('deals correct number of cards per player (1 card each)', () => {
    const deck = shuffleDeck(createDeck());
    const { hands, remaining } = dealCards(deck, 1);

    expect(hands).toHaveLength(4);
    hands.forEach(hand => expect(hand).toHaveLength(1));
    expect(remaining).toHaveLength(36 - 4);
  });

  it('deals correct number of cards per player (9 cards each, full deal)', () => {
    const deck = shuffleDeck(createDeck());
    const { hands, remaining } = dealCards(deck, 9);

    expect(hands).toHaveLength(4);
    hands.forEach(hand => expect(hand).toHaveLength(9));
    expect(remaining).toHaveLength(0);
  });

  it('deals correct number of cards per player (5 cards each)', () => {
    const deck = shuffleDeck(createDeck());
    const { hands, remaining } = dealCards(deck, 5);

    hands.forEach(hand => expect(hand).toHaveLength(5));
    expect(remaining).toHaveLength(36 - 20);
  });

  it('all dealt cards are unique', () => {
    const deck = shuffleDeck(createDeck());
    const { hands } = dealCards(deck, 9);

    const allCards = hands.flat();
    const serialize = (c: Card) =>
      isJokerCard(c) ? `joker-${c.id}` : `${c.suit}-${c.rank}`;
    const unique = new Set(allCards.map(serialize));
    expect(unique.size).toBe(36);
  });

  it('throws when trying to deal more cards than available', () => {
    const deck = shuffleDeck(createDeck());
    expect(() => dealCards(deck, 10)).toThrow();
  });

  it('does not mutate the input deck', () => {
    const deck = shuffleDeck(createDeck());
    const original = [...deck];
    dealCards(deck, 5);
    expect(deck).toEqual(original);
  });
});

describe('sortHand', () => {
  it('puts Jokers first', () => {
    const hand: Card[] = [
      { type: 'suit', suit: 'hearts', rank: 'A' },
      { type: 'joker', id: 2 },
      { type: 'suit', suit: 'spades', rank: 'K' },
      { type: 'joker', id: 1 },
    ];

    const sorted = sortHand(hand);
    expect(sorted[0]).toEqual({ type: 'joker', id: 1 });
    expect(sorted[1]).toEqual({ type: 'joker', id: 2 });
  });

  it('sorts suits in order: spades, hearts, diamonds, clubs', () => {
    const hand: Card[] = [
      { type: 'suit', suit: 'clubs', rank: 'A' },
      { type: 'suit', suit: 'hearts', rank: 'A' },
      { type: 'suit', suit: 'diamonds', rank: 'A' },
      { type: 'suit', suit: 'spades', rank: 'A' },
    ];

    const sorted = sortHand(hand);
    expect((sorted[0] as SuitCard).suit).toBe('spades');
    expect((sorted[1] as SuitCard).suit).toBe('hearts');
    expect((sorted[2] as SuitCard).suit).toBe('diamonds');
    expect((sorted[3] as SuitCard).suit).toBe('clubs');
  });

  it('sorts ranks high to low within same suit', () => {
    const hand: Card[] = [
      { type: 'suit', suit: 'hearts', rank: '7' },
      { type: 'suit', suit: 'hearts', rank: 'A' },
      { type: 'suit', suit: 'hearts', rank: 'J' },
      { type: 'suit', suit: 'hearts', rank: '10' },
    ];

    const sorted = sortHand(hand);
    expect((sorted[0] as SuitCard).rank).toBe('A');
    expect((sorted[1] as SuitCard).rank).toBe('J');
    expect((sorted[2] as SuitCard).rank).toBe('10');
    expect((sorted[3] as SuitCard).rank).toBe('7');
  });

  it('does not mutate the original hand', () => {
    const hand: Card[] = [
      { type: 'suit', suit: 'clubs', rank: 'A' },
      { type: 'suit', suit: 'hearts', rank: 'A' },
    ];
    const original = [...hand];
    sortHand(hand);
    expect(hand).toEqual(original);
  });
});
