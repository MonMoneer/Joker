import type { GameSettings, Suit, JokerMode } from '@joker/engine';

// Client → Server events
export interface ClientToServerEvents {
  'room:create': (data: { playerName: string; playerId: string; settings: GameSettings }) => void;
  'room:join': (data: { roomCode: string; playerName: string; playerId: string }) => void;
  'room:leave': (data: { roomCode: string }) => void;
  'room:add-ai': (data: { roomCode: string; difficulty: string }) => void;
  'room:settings': (data: { roomCode: string; settings: GameSettings }) => void;
  'game:start': (data: { roomCode: string }) => void;
  'ceremony:pick-card': (data: { roomCode: string; cardIndex: number }) => void;
  'game:bid': (data: { roomCode: string; bid: number }) => void;
  'game:play-card': (data: { roomCode: string; cardIndex: number }) => void;
  'game:joker-choice': (data: { roomCode: string; mode: JokerMode; suit: Suit }) => void;
  'game:next-hand': (data: { roomCode: string }) => void;
  'game:reconnect': (data: { roomCode: string; playerId: string; token: string }) => void;
}

// Server → Client events
export interface ServerToClientEvents {
  'room:created': (data: { roomCode: string; players: RoomPlayerInfo[] }) => void;
  'room:player-joined': (data: { player: RoomPlayerInfo; players: RoomPlayerInfo[] }) => void;
  'room:player-left': (data: { playerId: string; players: RoomPlayerInfo[] }) => void;
  'room:settings-updated': (data: { settings: GameSettings }) => void;
  'room:error': (data: { message: string; code: string }) => void;
  'game:state': (data: ClientGameState) => void;
  'game:ceremony-state': (data: CeremonyClientState) => void;
  'game:trick-complete': (data: { winner: number; cards: any[] }) => void;
  'game:hand-complete': (data: { scores: number[]; kingStatus: any }) => void;
  'game:set-complete': (data: { setIndex: number; kings: any[]; adjustedScores: number[] }) => void;
  'game:over': (data: { finalScores: number[]; winner: number; stats: any }) => void;
  'game:error': (data: { message: string }) => void;
  'player:disconnected': (data: { playerId: string; timeout: number }) => void;
  'player:reconnected': (data: { playerId: string }) => void;
}

export interface RoomPlayerInfo {
  id: string;
  name: string;
  isAI: boolean;
  isConnected: boolean;
}

export interface ClientGameState {
  id: string;
  phase: string;
  currentSet: number;
  currentHandConfig: { handNumber: number; setNumber: number; cardsPerPlayer: number; handInSet: number };
  dealerIndex: number;
  handNumber: number;
  trump: { suit: string | null; isNoTrump: boolean; card: any };
  myHand: any[];
  myPlayerIndex: number;
  bidState: { bids: (number | null)[]; currentBidder: number; dealerIndex: number; restrictedBid: number | null };
  bids: number[];
  currentTrick: { plays: any[]; leadSuit: string | null };
  currentTurn: number;
  tricksWon: number[];
  trickNumber: number;
  scores: number[];
  handScores: any[][];
  settings: GameSettings;
  players: (RoomPlayerInfo & { cardCount: number })[];
}

export interface CeremonyClientState {
  spreadCards: number; // Number of cards spread (positions only, not values)
  picks: { playerIndex: number; card: any }[];
  currentPicker: number;
  firstAcePlayer: number | null;
  isComplete: boolean;
}
