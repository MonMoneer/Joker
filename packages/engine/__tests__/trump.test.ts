import { describe, it, expect } from 'vitest';
import { determineTrump, trumpFromCard, isTrumpSuit, isTrumpCard } from '../src/trump';
import { getHandConfig } from '../src/hand-sequence';
import type { Card, TrumpInfo } from '../src/types';

describe('trumpFromCard', () => {
  it('suit card determines trump suit', () => {
    const card: Card = { type: 'suit', suit: 'hearts', rank: 'K' };
    const trump = trumpFromCard(card);
    expect(trump.suit).toBe('hearts');
    expect(trump.isNoTrump).toBe(false);
    expect(trump.card).toEqual(card);
  });

  it('Joker means no trumps', () => {
    const card: Card = { type: 'joker', id: 1 };
    const trump = trumpFromCard(card);
    expect(trump.suit).toBeNull();
    expect(trump.isNoTrump).toBe(true);
    expect(trump.card).toEqual(card);
  });
});

describe('determineTrump', () => {
  it('Set 1: uses first card of remaining deck', () => {
    const handConfig = getHandConfig(3); // Set 1, 3 cards
    const trumpCard: Card = { type: 'suit', suit: 'diamonds', rank: 'Q' };
    const remaining = [trumpCard, { type: 'suit' as const, suit: 'clubs' as const, rank: 'A' as const }];

    const trump = determineTrump(handConfig, remaining, []);
    expect(trump.suit).toBe('diamonds');
    expect(trump.card).toEqual(trumpCard);
  });

  it('Set 3: uses first card of remaining deck', () => {
    const handConfig = getHandConfig(15); // Set 3
    const trumpCard: Card = { type: 'suit', suit: 'spades', rank: '9' };
    const remaining = [trumpCard];

    const trump = determineTrump(handConfig, remaining, []);
    expect(trump.suit).toBe('spades');
  });

  it('Set 2: uses dealers last card', () => {
    const handConfig = getHandConfig(9); // Set 2, 9 cards
    const dealerHand: Card[] = [
      { type: 'suit', suit: 'hearts', rank: 'A' },
      { type: 'suit', suit: 'clubs', rank: 'K' },
      { type: 'suit', suit: 'hearts', rank: '7' },
      { type: 'suit', suit: 'diamonds', rank: 'J' },
      { type: 'suit', suit: 'spades', rank: '10' },
      { type: 'suit', suit: 'clubs', rank: '9' },
      { type: 'suit', suit: 'hearts', rank: '8' },
      { type: 'suit', suit: 'diamonds', rank: 'Q' },
      { type: 'suit', suit: 'spades', rank: 'A' }, // Last card = trump
    ];

    const trump = determineTrump(handConfig, [], dealerHand);
    expect(trump.suit).toBe('spades');
    expect(trump.card).toEqual({ type: 'suit', suit: 'spades', rank: 'A' });
  });

  it('Joker as trump card means no trumps', () => {
    const handConfig = getHandConfig(5); // Set 1
    const joker: Card = { type: 'joker', id: 1 };
    const remaining = [joker];

    const trump = determineTrump(handConfig, remaining, []);
    expect(trump.suit).toBeNull();
    expect(trump.isNoTrump).toBe(true);
  });

  it('throws when remaining deck is empty for Sets 1/3', () => {
    const handConfig = getHandConfig(2); // Set 1
    expect(() => determineTrump(handConfig, [], [])).toThrow();
  });

  it('throws when dealer hand is empty for Sets 2/4', () => {
    const handConfig = getHandConfig(9); // Set 2
    expect(() => determineTrump(handConfig, [], [])).toThrow();
  });
});

describe('isTrumpSuit', () => {
  it('returns true for matching trump suit', () => {
    const trump: TrumpInfo = { suit: 'hearts', isNoTrump: false, card: null };
    expect(isTrumpSuit('hearts', trump)).toBe(true);
  });

  it('returns false for non-trump suit', () => {
    const trump: TrumpInfo = { suit: 'hearts', isNoTrump: false, card: null };
    expect(isTrumpSuit('clubs', trump)).toBe(false);
  });

  it('returns false when no trumps', () => {
    const trump: TrumpInfo = { suit: null, isNoTrump: true, card: null };
    expect(isTrumpSuit('hearts', trump)).toBe(false);
    expect(isTrumpSuit('spades', trump)).toBe(false);
  });
});

describe('isTrumpCard', () => {
  const trump: TrumpInfo = { suit: 'hearts', isNoTrump: false, card: null };

  it('returns true for a card of the trump suit', () => {
    expect(isTrumpCard({ type: 'suit', suit: 'hearts', rank: 'A' }, trump)).toBe(true);
  });

  it('returns false for a card of another suit', () => {
    expect(isTrumpCard({ type: 'suit', suit: 'clubs', rank: 'A' }, trump)).toBe(false);
  });

  it('returns false for Jokers (they are special, not trumps)', () => {
    expect(isTrumpCard({ type: 'joker', id: 1 }, trump)).toBe(false);
  });

  it('returns false for any card when no trumps', () => {
    const noTrump: TrumpInfo = { suit: null, isNoTrump: true, card: null };
    expect(isTrumpCard({ type: 'suit', suit: 'hearts', rank: 'A' }, noTrump)).toBe(false);
  });
});
