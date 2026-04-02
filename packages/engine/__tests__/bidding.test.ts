import { describe, it, expect } from 'vitest';
import {
  createBidState,
  calculateDealerRestriction,
  validateBid,
  placeBid,
  isBiddingComplete,
  getFinalizedBids,
} from '../src/bidding';
import type { PlayerIndex, BidState } from '../src/types';

describe('createBidState', () => {
  it('sets first bidder to player left of dealer', () => {
    const state = createBidState(0 as PlayerIndex, 5);
    expect(state.currentBidder).toBe(1);

    const state2 = createBidState(3 as PlayerIndex, 5);
    expect(state2.currentBidder).toBe(0);
  });

  it('initializes all bids to null', () => {
    const state = createBidState(0 as PlayerIndex, 5);
    expect(state.bids).toEqual([null, null, null, null]);
  });

  it('stores dealer index', () => {
    const state = createBidState(2 as PlayerIndex, 5);
    expect(state.dealerIndex).toBe(2);
  });
});

describe('calculateDealerRestriction', () => {
  it('restricts dealer when 3 bids sum would equal cards dealt', () => {
    // 5 cards, bids so far: 1 + 2 + 1 = 4. Dealer cant bid 1 (4+1=5)
    const restricted = calculateDealerRestriction([1, 2, 1, null], 5);
    expect(restricted).toBe(1);
  });

  it('restricts dealer from bidding 0 (pass) when needed', () => {
    // 3 cards, bids so far: 1 + 1 + 1 = 3. Dealer cant bid 0 (3+0=3)
    const restricted = calculateDealerRestriction([1, 1, 1, null], 3);
    expect(restricted).toBe(0);
  });

  it('no restriction if only 2 bids placed', () => {
    const restricted = calculateDealerRestriction([1, 2, null, null], 5);
    expect(restricted).toBeNull();
  });

  it('no restriction if sum is already over cards dealt', () => {
    // 3 cards, bids: 2 + 2 + 2 = 6. Dealer would need -3, not a valid bid
    const restricted = calculateDealerRestriction([2, 2, 2, null], 3);
    expect(restricted).toBeNull();
  });

  it('handles 1-card hand correctly', () => {
    // 1 card, bids: 0 + 0 + 0 = 0. Dealer cant bid 1 (0+1=1)
    const restricted = calculateDealerRestriction([0, 0, 0, null], 1);
    expect(restricted).toBe(1);
  });

  it('handles 9-card hand correctly', () => {
    // 9 cards, bids: 3 + 2 + 2 = 7. Dealer cant bid 2 (7+2=9)
    const restricted = calculateDealerRestriction([3, 2, 2, null], 9);
    expect(restricted).toBe(2);
  });

  it('handles all zeros bid scenario', () => {
    // 1 card, bids: 1 + 0 + 0 = 1. Dealer can bid 0 freely (1+0=1 equals cards=1, so restricted=0)
    // Wait: total would be 1 which equals 1, so dealer CANT bid 0
    const restricted = calculateDealerRestriction([1, 0, 0, null], 1);
    expect(restricted).toBe(0);
  });
});

describe('validateBid', () => {
  it('rejects bid from wrong player', () => {
    const state = createBidState(0 as PlayerIndex, 5);
    const err = validateBid(0 as PlayerIndex, 2, state, 5); // Dealer, not first bidder
    expect(err).toBeTruthy();
  });

  it('accepts valid bid from current bidder', () => {
    const state = createBidState(0 as PlayerIndex, 5);
    const err = validateBid(1 as PlayerIndex, 3, state, 5);
    expect(err).toBeNull();
  });

  it('rejects negative bid', () => {
    const state = createBidState(0 as PlayerIndex, 5);
    const err = validateBid(1 as PlayerIndex, -1, state, 5);
    expect(err).toBeTruthy();
  });

  it('rejects bid exceeding cards per player', () => {
    const state = createBidState(0 as PlayerIndex, 5);
    const err = validateBid(1 as PlayerIndex, 6, state, 5);
    expect(err).toBeTruthy();
  });

  it('rejects non-integer bid', () => {
    const state = createBidState(0 as PlayerIndex, 5);
    const err = validateBid(1 as PlayerIndex, 2.5, state, 5);
    expect(err).toBeTruthy();
  });

  it('allows bid of 0 (pass)', () => {
    const state = createBidState(0 as PlayerIndex, 5);
    const err = validateBid(1 as PlayerIndex, 0, state, 5);
    expect(err).toBeNull();
  });

  it('rejects dealers restricted bid', () => {
    // Build state where dealer is next and restricted
    let state = createBidState(0 as PlayerIndex, 3); // Dealer=0, first bidder=1
    state = placeBid(state, 1 as PlayerIndex, 1, 3);
    state = placeBid(state, 2 as PlayerIndex, 1, 3);
    state = placeBid(state, 3 as PlayerIndex, 0, 3);
    // Now dealer (0) is up, total bids = 2, restricted from bidding 1 (2+1=3)
    const err = validateBid(0 as PlayerIndex, 1, state, 3);
    expect(err).toBeTruthy();
    expect(err).toContain('cannot bid');
  });

  it('allows dealer to bid other values', () => {
    let state = createBidState(0 as PlayerIndex, 3);
    state = placeBid(state, 1 as PlayerIndex, 1, 3);
    state = placeBid(state, 2 as PlayerIndex, 1, 3);
    state = placeBid(state, 3 as PlayerIndex, 0, 3);
    // Restricted from 1, but can bid 0 or 2 or 3
    expect(validateBid(0 as PlayerIndex, 0, state, 3)).toBeNull();
    expect(validateBid(0 as PlayerIndex, 2, state, 3)).toBeNull();
    expect(validateBid(0 as PlayerIndex, 3, state, 3)).toBeNull();
  });
});

describe('placeBid', () => {
  it('records the bid and advances to next bidder', () => {
    const state = createBidState(0 as PlayerIndex, 5);
    const newState = placeBid(state, 1 as PlayerIndex, 3, 5);

    expect(newState.bids[1]).toBe(3);
    expect(newState.currentBidder).toBe(2);
  });

  it('advances through all players correctly', () => {
    let state = createBidState(0 as PlayerIndex, 5); // Dealer=0
    state = placeBid(state, 1 as PlayerIndex, 2, 5);
    expect(state.currentBidder).toBe(2);

    state = placeBid(state, 2 as PlayerIndex, 1, 5);
    expect(state.currentBidder).toBe(3);

    state = placeBid(state, 3 as PlayerIndex, 1, 5);
    expect(state.currentBidder).toBe(0); // Dealer

    // Dealer should have restriction calculated
    expect(state.restrictedBid).toBe(1); // 2+1+1=4, restricted from 1 (4+1=5)
  });
});

describe('isBiddingComplete', () => {
  it('returns false when bids are missing', () => {
    const state = createBidState(0 as PlayerIndex, 5);
    expect(isBiddingComplete(state)).toBe(false);
  });

  it('returns true when all bids are placed', () => {
    let state = createBidState(0 as PlayerIndex, 5);
    state = placeBid(state, 1 as PlayerIndex, 2, 5);
    state = placeBid(state, 2 as PlayerIndex, 1, 5);
    state = placeBid(state, 3 as PlayerIndex, 1, 5);
    state = placeBid(state, 0 as PlayerIndex, 0, 5); // Dealer bids 0 (restricted from 1)
    expect(isBiddingComplete(state)).toBe(true);
  });
});

describe('getFinalizedBids', () => {
  it('throws when bidding is not complete', () => {
    const state = createBidState(0 as PlayerIndex, 5);
    expect(() => getFinalizedBids(state)).toThrow();
  });

  it('returns all bids as numbers', () => {
    let state = createBidState(0 as PlayerIndex, 3);
    state = placeBid(state, 1 as PlayerIndex, 1, 3);
    state = placeBid(state, 2 as PlayerIndex, 0, 3);
    state = placeBid(state, 3 as PlayerIndex, 1, 3);
    state = placeBid(state, 0 as PlayerIndex, 0, 3); // restricted from 1, so bid 0
    const bids = getFinalizedBids(state);
    expect(bids).toEqual([0, 1, 0, 1]);
  });
});
