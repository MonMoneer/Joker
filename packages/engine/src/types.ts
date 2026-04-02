// ============================================================
// Georgian Joker (ჯოკერი) — Core Type Definitions
// ============================================================

// --- Card Types ---

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export type Rank = 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6';

export interface SuitCard {
  type: 'suit';
  suit: Suit;
  rank: Rank;
}

export interface JokerCard {
  type: 'joker';
  id: 1 | 2;
}

export type Card = SuitCard | JokerCard;

export type JokerMode = 'high' | 'low';

export interface JokerPlay {
  mode: JokerMode;
  suit?: Suit; // Required when leading
}

// --- Player Types ---

export type PlayerId = string;

export interface Player {
  id: PlayerId;
  name: string;
  nameKa?: string;
  avatarUrl?: string;
  isAI: boolean;
  aiDifficulty?: AIDifficulty;
}

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export type PlayerIndex = 0 | 1 | 2 | 3;

// --- Game Settings ---

export interface GameSettings {
  histPenalty: boolean;
  histPenaltyAmount: -200 | -500;
  couplesMode: boolean;
  couples?: [PlayerId, PlayerId][]; // Array of partner pairs
}

// --- Game Structure ---

export type SetNumber = 1 | 2 | 3 | 4;

export interface HandConfig {
  handNumber: number;      // 1-24 (global hand index)
  setNumber: SetNumber;
  cardsPerPlayer: number;  // 1-9
  handInSet: number;       // 1-based index within the set
}

// --- Trump ---

export interface TrumpInfo {
  suit: Suit | null;       // null = no trumps
  isNoTrump: boolean;
  card: Card | null;       // The card that determined trump
}

// --- Bidding ---

export interface BidState {
  bids: (number | null)[];       // null = hasn't bid yet
  currentBidder: PlayerIndex;
  dealerIndex: PlayerIndex;
  restrictedBid: number | null;  // The bid the dealer cannot make
}

// --- Trick Play ---

export interface TrickPlay {
  playerIndex: PlayerIndex;
  card: Card;
  jokerPlay?: JokerPlay;   // Only if card is a Joker
}

export interface Trick {
  plays: TrickPlay[];
  leadSuit: Suit | null;   // Determined by first non-Joker card or Joker's declared suit
}

// --- Scoring ---

export interface HandScore {
  playerIndex: PlayerIndex;
  bid: number;
  tricksWon: number;
  score: number;
  isSuccess: boolean;
  isHistPenalty: boolean;
  isBidAllWonAll: boolean;
}

export interface KingInfo {
  playerIndex: PlayerIndex;
  setNumber: SetNumber;
  isSoleKing: boolean;
  lastHandScore: number;
  doubledScore: number;
  removedFromOthers: number;  // Score removed from each other player
}

export interface SetResult {
  setNumber: SetNumber;
  kings: KingInfo[];
  handScores: HandScore[][]; // Array of hand results, each containing 4 player scores
}

// --- Game Phases ---

export type GamePhase =
  | 'waiting'           // Lobby, waiting for players
  | 'dealer-ceremony'   // Picking cards to determine first dealer
  | 'dealing'           // Cards being dealt (animation)
  | 'bidding'           // Players placing bids
  | 'playing'           // Trick-taking in progress
  | 'joker-choice'      // Current player must choose high/low + suit for Joker
  | 'trick-result'      // Showing trick winner (brief pause)
  | 'hand-result'       // Showing hand scores
  | 'set-result'        // Showing set completion + King rule
  | 'game-over';        // Game finished

// --- Dealer Ceremony ---

export interface CeremonyState {
  spreadCards: Card[];           // All 36 cards spread face-down
  picks: { playerIndex: PlayerIndex; card: Card }[];
  currentPicker: PlayerIndex;
  firstAcePlayer: PlayerIndex | null;
  isComplete: boolean;
}

// --- Full Game State ---

export interface GameState {
  id: string;
  players: Player[];
  phase: GamePhase;

  // Game progression
  currentSet: SetNumber;
  currentHandConfig: HandConfig;
  dealerIndex: PlayerIndex;
  handNumber: number;        // 1-24

  // Trump
  trump: TrumpInfo;

  // Hands (each player's cards)
  hands: Card[][];           // hands[playerIndex] = cards

  // Bidding
  bidState: BidState;
  bids: number[];            // Finalized bids for current hand

  // Trick-taking
  currentTrick: Trick;
  currentTurn: PlayerIndex;
  tricksWon: number[];       // Per player for current hand
  trickNumber: number;

  // Scoring
  scores: number[];          // Cumulative scores
  handScores: HandScore[][]; // All hand results so far
  setHandScores: HandScore[][]; // Hand results for current set only
  allBidsSucceeded: boolean[]; // Per player: still on track for King in current set

  // Settings
  settings: GameSettings;

  // Ceremony
  ceremony?: CeremonyState;

  // Remaining deck (for trump card)
  remainingDeck: Card[];
}

// --- Game Actions (intents from players) ---

export type GameAction =
  | { type: 'CEREMONY_PICK'; playerIndex: PlayerIndex; cardIndex: number }
  | { type: 'PLACE_BID'; playerIndex: PlayerIndex; bid: number }
  | { type: 'PLAY_CARD'; playerIndex: PlayerIndex; cardIndex: number }
  | { type: 'JOKER_CHOICE'; playerIndex: PlayerIndex; mode: JokerMode; suit: Suit }
  | { type: 'NEXT_HAND' }
  | { type: 'NEXT_SET' };

// --- Utility Types ---

export function isSuitCard(card: Card): card is SuitCard {
  return card.type === 'suit';
}

export function isJokerCard(card: Card): card is JokerCard {
  return card.type === 'joker';
}

export function cardEquals(a: Card, b: Card): boolean {
  if (a.type === 'joker' && b.type === 'joker') return a.id === b.id;
  if (a.type === 'suit' && b.type === 'suit') return a.suit === b.suit && a.rank === b.rank;
  return false;
}
