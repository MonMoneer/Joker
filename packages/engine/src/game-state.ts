import type {
  GameState, GameAction, GamePhase, GameSettings, Player,
  PlayerIndex, Card, HandScore, TrumpInfo, SetNumber,
} from './types';
import { isSuitCard, isJokerCard } from './types';
import { createDeck, shuffleDeck, dealCards, sortHand } from './deck';
import { getHandConfig, getDealerForHand, getFirstPlayer, isLastHandInSet, isGameOver } from './hand-sequence';
import { determineTrump } from './trump';
import { createBidState, validateBid, placeBid, isBiddingComplete, getFinalizedBids } from './bidding';
import { getLegalCardIndices, createTrick, addPlayToTrick, isTrickComplete, resolveTrick } from './tricks';
import { calculateAllHandScores, addHandScoresToCumulative } from './scoring';
import { applyKingRule, updateKingTracking } from './king-rule';
import { NUM_PLAYERS } from './constants';

/**
 * Creates the initial game state.
 */
export function createGameState(
  id: string,
  players: Player[],
  settings: GameSettings,
  firstDealerIndex: PlayerIndex
): GameState {
  if (players.length !== NUM_PLAYERS) {
    throw new Error(`Game requires exactly ${NUM_PLAYERS} players`);
  }

  const handConfig = getHandConfig(1);
  const dealerIndex = getDealerForHand(1, firstDealerIndex);

  return {
    id,
    players,
    phase: 'dealing',
    currentSet: 1,
    currentHandConfig: handConfig,
    dealerIndex,
    handNumber: 1,
    trump: { suit: null, isNoTrump: false, card: null },
    hands: [[], [], [], []],
    bidState: createBidState(dealerIndex, handConfig.cardsPerPlayer),
    bids: [],
    currentTrick: createTrick(),
    currentTurn: getFirstPlayer(dealerIndex),
    tricksWon: [0, 0, 0, 0],
    trickNumber: 0,
    scores: [0, 0, 0, 0],
    handScores: [],
    setHandScores: [],
    allBidsSucceeded: [true, true, true, true],
    settings,
    remainingDeck: [],
  };
}

/**
 * Deals cards for the current hand and transitions to bidding.
 */
export function dealHand(state: GameState): GameState {
  const deck = shuffleDeck(createDeck());
  const { hands, remaining } = dealCards(deck, state.currentHandConfig.cardsPerPlayer);

  // Sort each player's hand for display
  const sortedHands = hands.map(h => sortHand(h));

  // Determine trump
  const trump = determineTrump(
    state.currentHandConfig,
    remaining,
    sortedHands[state.dealerIndex]
  );

  const bidState = createBidState(state.dealerIndex, state.currentHandConfig.cardsPerPlayer);

  return {
    ...state,
    phase: 'bidding',
    hands: sortedHands,
    trump,
    remainingDeck: remaining,
    bidState,
    bids: [],
    currentTrick: createTrick(),
    currentTurn: getFirstPlayer(state.dealerIndex),
    tricksWon: [0, 0, 0, 0],
    trickNumber: 0,
  };
}

/**
 * Processes a game action and returns the new state.
 * This is the main reducer function: (state, action) => newState
 */
export function processAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'PLACE_BID':
      return handlePlaceBid(state, action.playerIndex, action.bid);

    case 'PLAY_CARD':
      return handlePlayCard(state, action.playerIndex, action.cardIndex);

    case 'JOKER_CHOICE':
      return handleJokerChoice(state, action.playerIndex, action.mode, action.suit);

    case 'NEXT_HAND':
      return advanceToNextHand(state);

    case 'NEXT_SET':
      return advanceToNextHand(state);

    default:
      return state;
  }
}

function handlePlaceBid(state: GameState, playerIndex: PlayerIndex, bid: number): GameState {
  if (state.phase !== 'bidding') {
    throw new Error(`Cannot bid in phase: ${state.phase}`);
  }

  const error = validateBid(playerIndex, bid, state.bidState, state.currentHandConfig.cardsPerPlayer);
  if (error) throw new Error(error);

  const newBidState = placeBid(state.bidState, playerIndex, bid, state.currentHandConfig.cardsPerPlayer);

  if (isBiddingComplete(newBidState)) {
    const finalBids = getFinalizedBids(newBidState);
    return {
      ...state,
      bidState: newBidState,
      bids: finalBids,
      phase: 'playing',
      currentTurn: getFirstPlayer(state.dealerIndex),
      currentTrick: createTrick(),
      trickNumber: 1,
    };
  }

  return {
    ...state,
    bidState: newBidState,
    currentTurn: newBidState.currentBidder,
  };
}

function handlePlayCard(state: GameState, playerIndex: PlayerIndex, cardIndex: number): GameState {
  if (state.phase !== 'playing') {
    throw new Error(`Cannot play card in phase: ${state.phase}`);
  }

  if (playerIndex !== state.currentTurn) {
    throw new Error(`Not player ${playerIndex}'s turn. Current: ${state.currentTurn}`);
  }

  const hand = state.hands[playerIndex];
  if (cardIndex < 0 || cardIndex >= hand.length) {
    throw new Error(`Invalid card index: ${cardIndex}`);
  }

  // Check legality
  const legalIndices = getLegalCardIndices(hand, state.currentTrick, state.trump);
  if (!legalIndices.includes(cardIndex)) {
    throw new Error('Illegal card play');
  }

  const card = hand[cardIndex];

  // If it's a Joker, need to wait for mode/suit choice
  if (isJokerCard(card)) {
    return {
      ...state,
      phase: 'joker-choice',
      // Store the pending card index temporarily
      _pendingJokerCardIndex: cardIndex,
    } as GameState & { _pendingJokerCardIndex: number };
  }

  // Play the suit card
  return executeCardPlay(state, playerIndex, cardIndex, card);
}

function handleJokerChoice(
  state: GameState,
  playerIndex: PlayerIndex,
  mode: 'high' | 'low',
  suit: string
): GameState {
  if (state.phase !== 'joker-choice') {
    throw new Error(`Cannot make Joker choice in phase: ${state.phase}`);
  }

  const pendingState = state as GameState & { _pendingJokerCardIndex?: number };
  const cardIndex = pendingState._pendingJokerCardIndex;
  if (cardIndex === undefined) {
    throw new Error('No pending Joker play');
  }

  const card = state.hands[playerIndex][cardIndex];
  const isLeading = state.currentTrick.plays.length === 0;

  const jokerPlay = {
    mode: mode as 'high' | 'low',
    suit: (isLeading ? suit : undefined) as any,
  };

  return executeCardPlay(
    { ...state, phase: 'playing' },
    playerIndex,
    cardIndex,
    card,
    jokerPlay
  );
}

function executeCardPlay(
  state: GameState,
  playerIndex: PlayerIndex,
  cardIndex: number,
  card: Card,
  jokerPlay?: { mode: 'high' | 'low'; suit?: string }
): GameState {
  // Remove card from hand
  const newHands = state.hands.map((h, i) =>
    i === playerIndex ? [...h.slice(0, cardIndex), ...h.slice(cardIndex + 1)] : [...h]
  );

  // Add play to trick
  const newTrick = addPlayToTrick(state.currentTrick, {
    playerIndex,
    card,
    jokerPlay: jokerPlay as any,
  });

  // Check if trick is complete
  if (isTrickComplete(newTrick)) {
    const winner = resolveTrick(newTrick, state.trump);
    const newTricksWon = [...state.tricksWon];
    newTricksWon[winner]++;

    // Check if hand is complete (all cards played)
    const cardsRemaining = newHands.some(h => h.length > 0);

    if (!cardsRemaining) {
      // Hand complete — calculate scores
      return resolveHand(state, newHands, newTricksWon, winner);
    }

    // More tricks to play — keep completed trick visible during trick-result
    return {
      ...state,
      hands: newHands,
      currentTrick: newTrick, // Keep the 4 cards visible
      currentTurn: winner,
      tricksWon: newTricksWon,
      trickNumber: state.trickNumber + 1,
      phase: 'trick-result',
      _trickWinner: winner,
    } as GameState & { _trickWinner: PlayerIndex };
  }

  // Trick not complete, next player
  const nextTurn = ((playerIndex + 1) % NUM_PLAYERS) as PlayerIndex;

  return {
    ...state,
    hands: newHands,
    currentTrick: newTrick,
    currentTurn: nextTurn,
  };
}

function resolveHand(
  state: GameState,
  hands: Card[][],
  tricksWon: number[],
  lastTrickWinner: PlayerIndex
): GameState {
  const handScores = calculateAllHandScores(
    state.bids,
    tricksWon,
    state.currentHandConfig.cardsPerPlayer,
    state.settings
  );

  const newCumulativeScores = addHandScoresToCumulative(state.scores, handScores);
  const newAllHandScores = [...state.handScores, handScores];
  const newSetHandScores = [...state.setHandScores, handScores];
  const newKingTracking = updateKingTracking(state.allBidsSucceeded, handScores);

  // Check if this is the last hand in the set
  if (isLastHandInSet(state.handNumber)) {
    // Apply King rule
    const { kings, adjustedScores } = applyKingRule(
      newSetHandScores,
      state.currentSet,
      state.settings,
      newCumulativeScores
    );

    // Check if game is over
    if (isGameOver(state.handNumber)) {
      return {
        ...state,
        hands,
        tricksWon,
        scores: adjustedScores,
        handScores: newAllHandScores,
        setHandScores: newSetHandScores,
        allBidsSucceeded: newKingTracking,
        phase: 'game-over',
      };
    }

    return {
      ...state,
      hands,
      tricksWon,
      scores: adjustedScores,
      handScores: newAllHandScores,
      setHandScores: newSetHandScores,
      allBidsSucceeded: newKingTracking,
      phase: 'set-result',
    };
  }

  return {
    ...state,
    hands,
    tricksWon,
    scores: newCumulativeScores,
    handScores: newAllHandScores,
    setHandScores: newSetHandScores,
    allBidsSucceeded: newKingTracking,
    phase: 'hand-result',
  };
}

/**
 * Advances to the next hand after showing results.
 */
export function advanceToNextHand(state: GameState): GameState {
  if (state.phase === 'game-over') {
    throw new Error('Game is already over');
  }

  const nextHandNumber = state.handNumber + 1;
  const nextHandConfig = getHandConfig(nextHandNumber);
  const isNewSet = nextHandConfig.setNumber !== state.currentSet;

  const firstDealer = getDealerForHand(1, state.dealerIndex);
  const nextDealer = getDealerForHand(nextHandNumber, firstDealer);

  const newState: GameState = {
    ...state,
    handNumber: nextHandNumber,
    currentHandConfig: nextHandConfig,
    currentSet: nextHandConfig.setNumber as SetNumber,
    dealerIndex: nextDealer,
    phase: 'dealing',
    // Reset set tracking if entering a new set
    setHandScores: isNewSet ? [] : state.setHandScores,
    allBidsSucceeded: isNewSet ? [true, true, true, true] : state.allBidsSucceeded,
  };

  // Auto-deal
  return dealHand(newState);
}

/**
 * Gets the winner of the game (player with highest score).
 */
export function getWinner(state: GameState): PlayerIndex {
  let maxScore = -Infinity;
  let winner: PlayerIndex = 0;

  state.scores.forEach((score, i) => {
    if (score > maxScore) {
      maxScore = score;
      winner = i as PlayerIndex;
    }
  });

  return winner;
}

/**
 * Starts the game by dealing the first hand.
 */
export function startGame(state: GameState): GameState {
  return dealHand(state);
}
