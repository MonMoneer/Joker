"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import type { GameSettings, PlayerIndex, Suit, JokerMode } from "@joker/engine";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001";

interface UseSocketReturn {
  isConnected: boolean;
  roomCode: string | null;
  players: any[];
  gameState: any | null;
  error: string | null;
  createRoom: (playerName: string, playerId: string, settings: GameSettings) => void;
  joinRoom: (roomCode: string, playerName: string, playerId: string) => void;
  leaveRoom: () => void;
  addAI: (difficulty: string) => void;
  updateSettings: (settings: GameSettings) => void;
  startGame: () => void;
  placeBid: (bid: number) => void;
  playCard: (cardIndex: number) => void;
  jokerChoice: (mode: JokerMode, suit: Suit) => void;
  nextHand: () => void;
}

export function useSocket(): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [gameState, setGameState] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = io(SERVER_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      setError(null);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("room:created", ({ roomCode: code, players: p }) => {
      setRoomCode(code);
      setPlayers(p);
    });

    socket.on("room:player-joined", ({ players: p }) => {
      setPlayers(p);
    });

    socket.on("room:player-left", ({ playerId }) => {
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    });

    socket.on("room:settings-updated", ({ settings }) => {
      // Settings updated — UI can react
    });

    socket.on("room:error", ({ message }) => {
      setError(message);
    });

    socket.on("game:state", (state) => {
      setGameState(state);
      setError(null);
    });

    socket.on("game:error", ({ message }) => {
      setError(message);
    });

    socket.on("player:disconnected", ({ playerId, timeout }) => {
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === playerId ? { ...p, isConnected: false } : p
        )
      );
    });

    socket.on("player:reconnected", ({ playerId }) => {
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === playerId ? { ...p, isConnected: true } : p
        )
      );
    });

    socket.on("player:replaced-by-ai", ({ playerId, playerName }) => {
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === playerId ? { ...p, isAI: true, name: playerName } : p
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const emit = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  return {
    isConnected,
    roomCode,
    players,
    gameState,
    error,
    createRoom: (playerName, playerId, settings) =>
      emit("room:create", { playerName, playerId, settings }),
    joinRoom: (code, playerName, playerId) =>
      emit("room:join", { roomCode: code, playerName, playerId }),
    leaveRoom: () => {
      if (roomCode) emit("room:leave", { roomCode });
      setRoomCode(null);
      setPlayers([]);
      setGameState(null);
    },
    addAI: (difficulty) =>
      emit("room:add-ai", { roomCode, difficulty }),
    updateSettings: (settings) =>
      emit("room:settings", { roomCode, settings }),
    startGame: () => emit("game:start", { roomCode }),
    placeBid: (bid) => emit("game:bid", { roomCode, bid }),
    playCard: (cardIndex) =>
      emit("game:play-card", { roomCode, cardIndex }),
    jokerChoice: (mode, suit) =>
      emit("game:joker-choice", { roomCode, mode, suit }),
    nextHand: () => emit("game:next-hand", { roomCode }),
  };
}
