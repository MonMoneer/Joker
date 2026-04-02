import type { GameSettings, Player } from '@joker/engine';
import { ROOM_CODE_CHARS, ROOM_CODE_LENGTH, TIMING, NUM_PLAYERS } from '@joker/engine';

export interface Room {
  code: string;
  players: RoomPlayer[];
  hostId: string;
  settings: GameSettings;
  createdAt: number;
  gameStarted: boolean;
  lastActivity: number;
}

export interface RoomPlayer {
  id: string;
  socketId: string;
  name: string;
  isAI: boolean;
  isConnected: boolean;
}

const rooms = new Map<string, Room>();

export function generateRoomCode(): string {
  let code: string;
  do {
    code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
    }
  } while (rooms.has(code));
  return code;
}

export function createRoom(hostId: string, hostSocketId: string, hostName: string, settings: GameSettings): Room {
  const code = generateRoomCode();
  const room: Room = {
    code,
    players: [{
      id: hostId,
      socketId: hostSocketId,
      name: hostName,
      isAI: false,
      isConnected: true,
    }],
    hostId,
    settings,
    createdAt: Date.now(),
    gameStarted: false,
    lastActivity: Date.now(),
  };
  rooms.set(code, room);
  return room;
}

export function joinRoom(code: string, playerId: string, socketId: string, playerName: string): Room | null {
  const room = rooms.get(code);
  if (!room) return null;
  if (room.gameStarted) return null;
  if (room.players.length >= NUM_PLAYERS) return null;

  // Check if player is reconnecting
  const existing = room.players.find(p => p.id === playerId);
  if (existing) {
    existing.socketId = socketId;
    existing.isConnected = true;
    room.lastActivity = Date.now();
    return room;
  }

  room.players.push({
    id: playerId,
    socketId,
    name: playerName,
    isAI: false,
    isConnected: true,
  });
  room.lastActivity = Date.now();
  return room;
}

export function addAIToRoom(code: string, difficulty: string): Room | null {
  const room = rooms.get(code);
  if (!room || room.players.length >= NUM_PLAYERS) return null;

  const aiNames = ['Bot Alpha', 'Bot Beta', 'Bot Gamma'];
  const aiCount = room.players.filter(p => p.isAI).length;

  room.players.push({
    id: `ai-${Date.now()}-${aiCount}`,
    socketId: '',
    name: aiNames[aiCount] || `Bot ${aiCount + 1}`,
    isAI: true,
    isConnected: true,
  });
  room.lastActivity = Date.now();
  return room;
}

export function leaveRoom(code: string, playerId: string): Room | null {
  const room = rooms.get(code);
  if (!room) return null;

  room.players = room.players.filter(p => p.id !== playerId);
  room.lastActivity = Date.now();

  if (room.players.filter(p => !p.isAI).length === 0) {
    rooms.delete(code);
    return null;
  }

  // Transfer host if needed
  if (room.hostId === playerId) {
    const newHost = room.players.find(p => !p.isAI);
    if (newHost) room.hostId = newHost.id;
  }

  return room;
}

export function getRoom(code: string): Room | null {
  return rooms.get(code) || null;
}

export function updateRoomSettings(code: string, settings: GameSettings): Room | null {
  const room = rooms.get(code);
  if (!room || room.gameStarted) return null;
  room.settings = settings;
  room.lastActivity = Date.now();
  return room;
}

export function disconnectPlayer(socketId: string): { room: Room; playerId: string } | null {
  for (const room of rooms.values()) {
    const player = room.players.find(p => p.socketId === socketId);
    if (player) {
      player.isConnected = false;
      return { room, playerId: player.id };
    }
  }
  return null;
}

// Clean up expired rooms periodically
export function cleanupExpiredRooms(): void {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (!room.gameStarted && now - room.lastActivity > TIMING.ROOM_EXPIRY) {
      rooms.delete(code);
    }
  }
}
