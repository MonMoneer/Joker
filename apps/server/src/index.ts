import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  createRoom, joinRoom, leaveRoom, getRoom, addAIToRoom,
  updateRoomSettings, disconnectPlayer, cleanupExpiredRooms,
} from './room-manager';
import {
  startNewGame, getGameState, setGameState as setActiveGame, handleBid, handlePlayCard,
  handleJokerChoice, handleNextHand, getFilteredState,
  processAITurns, removeGame,
} from './game-controller';
import type { GameSettings, PlayerIndex, Suit, JokerMode } from '@joker/engine';

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
const io = new Server(server, {
  cors: {
    origin: [clientUrl, 'https://royal-joker.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Socket.IO handlers
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('room:create', ({ playerName, playerId, settings }: {
    playerName: string; playerId: string; settings: GameSettings;
  }) => {
    const room = createRoom(playerId, socket.id, playerName, settings);
    socket.join(room.code);
    socket.emit('room:created', { roomCode: room.code, players: room.players });
  });

  socket.on('room:join', ({ roomCode, playerName, playerId }: {
    roomCode: string; playerName: string; playerId: string;
  }) => {
    const room = joinRoom(roomCode, playerId, socket.id, playerName);
    if (!room) {
      socket.emit('room:error', { message: 'Room not found or full', code: 'ROOM_NOT_FOUND' });
      return;
    }
    socket.join(roomCode);
    io.to(roomCode).emit('room:player-joined', { player: { id: playerId, name: playerName }, players: room.players });
  });

  socket.on('room:leave', ({ roomCode }: { roomCode: string }) => {
    const result = disconnectPlayer(socket.id);
    if (result) {
      leaveRoom(roomCode, result.playerId);
      socket.leave(roomCode);
      io.to(roomCode).emit('room:player-left', { playerId: result.playerId });
    }
  });

  socket.on('room:add-ai', ({ roomCode, difficulty }: { roomCode: string; difficulty: string }) => {
    const room = addAIToRoom(roomCode, difficulty);
    if (room) {
      io.to(roomCode).emit('room:player-joined', { players: room.players });
    }
  });

  socket.on('room:settings', ({ roomCode, settings }: { roomCode: string; settings: GameSettings }) => {
    const room = updateRoomSettings(roomCode, settings);
    if (room) {
      io.to(roomCode).emit('room:settings-updated', { settings: room.settings });
    }
  });

  socket.on('game:start', ({ roomCode }: { roomCode: string }) => {
    const room = getRoom(roomCode);
    if (!room || room.players.length !== 4) {
      socket.emit('room:error', { message: 'Need exactly 4 players', code: 'NOT_ENOUGH_PLAYERS' });
      return;
    }

    try {
      room.gameStarted = true;
      const state = startNewGame(room);

      // Send filtered state to each player
      room.players.forEach((player, i) => {
        if (!player.isAI) {
          const filtered = getFilteredState(state, i as PlayerIndex);
          io.to(player.socketId).emit('game:state', filtered);
        }
      });

      // Process AI turns if AI goes first
      setTimeout(() => processAndBroadcastAI(roomCode, room), 1000);
    } catch (e) {
      socket.emit('room:error', { message: (e as Error).message, code: 'GAME_START_ERROR' });
    }
  });

  socket.on('game:bid', ({ roomCode, bid }: { roomCode: string; bid: number }) => {
    const room = getRoom(roomCode);
    if (!room) return;

    const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
    if (playerIndex === -1) return;

    try {
      const state = handleBid(roomCode, playerIndex as PlayerIndex, bid);
      broadcastState(roomCode, room, state);
      setTimeout(() => processAndBroadcastAI(roomCode, room), 800);
    } catch (e) {
      socket.emit('game:error', { message: (e as Error).message });
    }
  });

  socket.on('game:play-card', ({ roomCode, cardIndex }: { roomCode: string; cardIndex: number }) => {
    const room = getRoom(roomCode);
    if (!room) return;

    const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
    if (playerIndex === -1) return;

    try {
      const state = handlePlayCard(roomCode, playerIndex as PlayerIndex, cardIndex);
      broadcastState(roomCode, room, state);
      setTimeout(() => processAndBroadcastAI(roomCode, room), 800);
    } catch (e) {
      socket.emit('game:error', { message: (e as Error).message });
    }
  });

  socket.on('game:joker-choice', ({ roomCode, mode, suit }: {
    roomCode: string; mode: JokerMode; suit: Suit;
  }) => {
    const room = getRoom(roomCode);
    if (!room) return;

    const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
    if (playerIndex === -1) return;

    try {
      const state = handleJokerChoice(roomCode, playerIndex as PlayerIndex, mode, suit);
      broadcastState(roomCode, room, state);
      setTimeout(() => processAndBroadcastAI(roomCode, room), 800);
    } catch (e) {
      socket.emit('game:error', { message: (e as Error).message });
    }
  });

  socket.on('game:next-hand', ({ roomCode }: { roomCode: string }) => {
    const room = getRoom(roomCode);
    if (!room) return;

    try {
      const state = handleNextHand(roomCode);
      broadcastState(roomCode, room, state);
      setTimeout(() => processAndBroadcastAI(roomCode, room), 1000);
    } catch (e) {
      socket.emit('game:error', { message: (e as Error).message });
    }
  });

  socket.on('disconnect', () => {
    const result = disconnectPlayer(socket.id);
    if (result) {
      io.to(result.room.code).emit('player:disconnected', {
        playerId: result.playerId,
        timeout: 120000,
      });

      // Auto-replace with AI after 2 minutes if still disconnected during active game
      if (result.room.gameStarted) {
        setTimeout(() => {
          const room = getRoom(result.room.code);
          if (!room) return;
          const player = room.players.find(p => p.id === result.playerId);
          if (player && !player.isConnected) {
            player.isAI = true;
            player.name = `${player.name} (AI)`;
            io.to(result.room.code).emit('player:replaced-by-ai', {
              playerId: result.playerId,
              playerName: player.name,
            });
            // Process AI turns if it's now this player's turn
            const state = getGameState(result.room.code);
            if (state && state.players[state.currentTurn]?.id === result.playerId) {
              setTimeout(() => processAndBroadcastAI(result.room.code, room), 800);
            }
          }
        }, 120000);
      }
    }
    console.log(`Player disconnected: ${socket.id}`);
  });
});

const trickTimers = new Map<string, ReturnType<typeof setTimeout>>();

function broadcastState(roomCode: string, room: ReturnType<typeof getRoom>, state: any) {
  if (!room) return;
  room.players.forEach((player, i) => {
    if (!player.isAI && player.isConnected) {
      const filtered = getFilteredState(state, i as PlayerIndex);
      io.to(player.socketId).emit('game:state', filtered);
    }
  });

  // Auto-advance trick-result after delay (server-authoritative)
  if (state.phase === 'trick-result') {
    const prev = trickTimers.get(roomCode);
    if (prev) clearTimeout(prev);
    trickTimers.set(roomCode, setTimeout(() => {
      trickTimers.delete(roomCode);
      const current = getGameState(roomCode);
      if (!current || current.phase !== 'trick-result') return;
      const winner = (current as any)._trickWinner ?? current.currentTurn;
      const advanced = {
        ...current,
        phase: 'playing' as const,
        currentTurn: winner,
        currentTrick: { plays: [], leadSuit: null },
      };
      setActiveGame(roomCode, advanced as any);
      broadcastState(roomCode, room, advanced);
      setTimeout(() => processAndBroadcastAI(roomCode, room), 800);
    }, 2200));
  }
}

function processAndBroadcastAI(roomCode: string, room: ReturnType<typeof getRoom>) {
  if (!room) return;
  const states = processAITurns(roomCode);
  if (states.length > 0) {
    const finalState = states[states.length - 1];
    broadcastState(roomCode, room, finalState);
  }
}

// Cleanup expired rooms every minute
setInterval(cleanupExpiredRooms, 60000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🃏 Joker server running on port ${PORT}`);
});
