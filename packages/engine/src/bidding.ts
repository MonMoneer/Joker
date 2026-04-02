import type { PlayerIndex, BidState } from './types';
import { NUM_PLAYERS } from './constants';

/**
 * Creates the initial bid state for a hand.
 *
 * @param dealerIndex - Index of the dealer (bids last)
 * @param cardsPerPlayer - Number of cards in this hand
 */
export function createBidState(
  dealerIndex: PlayerIndex,
  cardsPerPlayer: number
): BidState {
  const firstBidder = ((dealerIndex + 1) % NUM_PLAYERS) as PlayerIndex;

  return {
    bids: [null, null, null, null],
    currentBidder: firstBidder,
    dealerIndex,
    restrictedBid: null, // Calculated when dealer's turn comes
  };
}

/**
 * Calculates which bid the dealer is restricted from making.
 *
 * Rule: The total of all bids cannot equal the number of cards dealt.
 * The dealer (last to bid) is restricted from making the equalizing bid.
 *
 * @param bids - Array of bids placed so far (null for players who haven't bid)
 * @param cardsPerPlayer - Number of cards dealt this hand
 * @returns The bid value the dealer cannot make, or null if no restriction
 */
export function calculateDealerRestriction(
  bids: (number | null)[],
  cardsPerPlayer: number
): number | null {
  // Sum all non-null bids
  const totalBids = bids.reduce<number>((sum, bid) => sum + (bid ?? 0), 0);

  // Count how many players have bid
  const bidCount = bids.filter(b => b !== null).length;

  // Only restrict when 3 players have bid (dealer is next)
  if (bidCount !== NUM_PLAYERS - 1) return null;

  // The dealer cannot bid the value that would make total = cardsPerPlayer
  const restrictedBid = cardsPerPlayer - totalBids;

  // Only restrict if the restricted bid is a valid bid (0 to cardsPerPlayer)
  if (restrictedBid < 0 || restrictedBid > cardsPerPlayer) return null;

  return restrictedBid;
}

/**
 * Validates a bid.
 *
 * @returns An error message if invalid, or null if valid
 */
export function validateBid(
  playerIndex: PlayerIndex,
  bid: number,
  bidState: BidState,
  cardsPerPlayer: number
): string | null {
  // Must be the current bidder's turn
  if (playerIndex !== bidState.currentBidder) {
    return `Not player ${playerIndex}'s turn to bid. Current bidder: ${bidState.currentBidder}`;
  }

  // Bid must be a non-negative integer
  if (!Number.isInteger(bid) || bid < 0) {
    return `Bid must be a non-negative integer, got ${bid}`;
  }

  // Bid cannot exceed cards per player
  if (bid > cardsPerPlayer) {
    return `Bid cannot exceed ${cardsPerPlayer} cards, got ${bid}`;
  }

  // Check dealer restriction
  if (playerIndex === bidState.dealerIndex) {
    const restricted = calculateDealerRestriction(bidState.bids, cardsPerPlayer);
    if (restricted !== null && bid === restricted) {
      return `Dealer cannot bid ${restricted} (would make total bids equal cards dealt)`;
    }
  }

  return null;
}

/**
 * Places a bid and advances to the next bidder.
 *
 * @returns Updated bid state
 */
export function placeBid(
  bidState: BidState,
  playerIndex: PlayerIndex,
  bid: number,
  cardsPerPlayer: number
): BidState {
  const newBids = [...bidState.bids];
  newBids[playerIndex] = bid;

  const nextBidder = ((playerIndex + 1) % NUM_PLAYERS) as PlayerIndex;
  const allBid = newBids.every(b => b !== null);

  // Calculate dealer restriction for the next bidder if they're the dealer
  let restrictedBid: number | null = null;
  if (!allBid && nextBidder === bidState.dealerIndex) {
    restrictedBid = calculateDealerRestriction(newBids, cardsPerPlayer);
  }

  return {
    bids: newBids,
    currentBidder: allBid ? bidState.currentBidder : nextBidder,
    dealerIndex: bidState.dealerIndex,
    restrictedBid,
  };
}

/**
 * Checks if all players have placed their bids.
 */
export function isBiddingComplete(bidState: BidState): boolean {
  return bidState.bids.every(b => b !== null);
}

/**
 * Gets the finalized bids (asserts all are non-null).
 */
export function getFinalizedBids(bidState: BidState): number[] {
  if (!isBiddingComplete(bidState)) {
    throw new Error('Bidding is not complete');
  }
  return bidState.bids as number[];
}
