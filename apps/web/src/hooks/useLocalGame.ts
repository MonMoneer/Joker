"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  GameState,
  PlayerIndex,
  GameSettings,
  Player,
  Suit,
  JokerMode,
} from "@joker/engine";
import {
  createGameState,
  startGame,
  processAction,
  advanceToNextHand,
  getLegalCardIndices,
  isJokerCard,
  calculateAIBid,
  chooseCardToPlay,
  chooseJokerPlay,
  NUM_PLAYERS,
} from "@joker/engine";

const DEFAULT_SETTINGS: GameSettings = {
  histPenalty: false,
  histPenaltyAmount: -200,
  couplesMode: false,
};

export function useLocalGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastTrickWinner, setLastTrickWinner] = useState<PlayerIndex | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const initGame = useCallback(
    (
      playerName: string,
      settings: GameSettings = DEFAULT_SETTINGS,
      aiDifficulty: 'easy' | 'medium' | 'hard' = 'medium',
      friendNames: string[] = []
    ) => {
      const botNames = ["Bot Alpha", "Bot Beta", "Bot Gamma"];
      const players: Player[] = [
        { id: "p0", name: playerName, isAI: false },
      ];

      // Fill slots: invited friends first (still AI-controlled), then bots
      for (let i = 0; i < 3; i++) {
        if (i < friendNames.length) {
          players.push({
            id: `friend-${i}`,
            name: friendNames[i],
            isAI: true,
            aiDifficulty,
          });
        } else {
          players.push({
            id: `bot-${i}`,
            name: botNames[i - friendNames.length] || `Bot ${i + 1}`,
            isAI: true,
            aiDifficulty,
          });
        }
      }

      try {
        const state = createGameState("local-game", players, settings, 0);
        const started = startGame(state);
        setGameState(started);
        setError(null);
      } catch (e) {
        setError((e as Error).message);
      }
    },
    []
  );

  const safeApply = useCallback(
    (fn: (s: GameState) => GameState) => {
      setGameState((prev) => {
        if (!prev) return prev;
        try {
          const next = fn(prev);
          setError(null);
          return next;
        } catch (e) {
          setError((e as Error).message);
          return prev;
        }
      });
    },
    []
  );

  const placeBid = useCallback(
    (bid: number) => {
      safeApply((s) =>
        processAction(s, {
          type: "PLACE_BID",
          playerIndex: s.currentTurn,
          bid,
        })
      );
    },
    [safeApply]
  );

  const playCard = useCallback(
    (cardIndex: number) => {
      safeApply((s) =>
        processAction(s, {
          type: "PLAY_CARD",
          playerIndex: s.currentTurn,
          cardIndex,
        })
      );
    },
    [safeApply]
  );

  const jokerChoice = useCallback(
    (mode: JokerMode, suit?: Suit) => {
      safeApply((s) =>
        processAction(s, {
          type: "JOKER_CHOICE",
          playerIndex: s.currentTurn,
          mode,
          suit: suit || "hearts",
        })
      );
    },
    [safeApply]
  );

  const nextHand = useCallback(() => {
    safeApply((s) => advanceToNextHand(s));
  }, [safeApply]);

  // ── Main game loop: handles phase transitions and AI turns ──
  useEffect(() => {
    if (!gameState) return;
    clearTimer();

    const { phase, currentTurn, players } = gameState;
    const currentPlayer = players[currentTurn];
    const isAI = currentPlayer?.isAI;

    // Phase: trick-result → show all 4 cards for 1.5s, then clear and continue
    if (phase === "trick-result") {
      const trickState = gameState as GameState & { _trickWinner?: PlayerIndex };
      const winner = trickState._trickWinner ?? currentTurn;
      setLastTrickWinner(winner);

      timerRef.current = setTimeout(() => {
        setGameState((prev) => {
          if (!prev || prev.phase !== "trick-result") return prev;
          // NOW clear the trick and advance
          return {
            ...prev,
            phase: "playing" as const,
            currentTurn: winner,
            currentTrick: { plays: [], leadSuit: null },
          };
        });
      }, 1500); // 1.5s to see all 4 cards on table
      return () => clearTimer();
    }

    // Phase: hand-result → show results, then auto-advance (or wait for human click)
    if (phase === "hand-result" || phase === "set-result") {
      // Auto-advance after delay (human can click "Next" to skip wait)
      timerRef.current = setTimeout(() => {
        setGameState((prev) => {
          if (!prev) return prev;
          if (prev.phase !== "hand-result" && prev.phase !== "set-result") return prev;
          try {
            return advanceToNextHand(prev);
          } catch {
            return prev;
          }
        });
      }, 4000); // 4s to read scores
      return () => clearTimer();
    }

    // Phase: game-over → do nothing (show final screen)
    if (phase === "game-over") return;

    // If it's not an AI's turn, do nothing (wait for human input)
    if (!isAI) return;

    // AI: bidding
    if (phase === "bidding") {
      timerRef.current = setTimeout(() => {
        safeApply((s) => {
          const hand = s.hands[s.currentTurn];
          const p = s.players[s.currentTurn];
          const bid = calculateAIBid(
            hand, s.trump, s.currentTurn,
            s.bidState.bids, s.currentHandConfig.cardsPerPlayer,
            s.dealerIndex, p.aiDifficulty || "medium"
          );
          return processAction(s, { type: "PLACE_BID", playerIndex: s.currentTurn, bid });
        });
      }, 500 + Math.random() * 800);
      return () => clearTimer();
    }

    // AI: playing
    if (phase === "playing") {
      timerRef.current = setTimeout(() => {
        safeApply((s) => {
          const hand = s.hands[s.currentTurn];
          const p = s.players[s.currentTurn];
          const bid = s.bids[s.currentTurn] || 0;
          const won = s.tricksWon[s.currentTurn];

          const cardIndex = chooseCardToPlay(
            hand, s.currentTrick, s.trump,
            bid, won, hand.length,
            p.aiDifficulty || "medium"
          );

          const card = hand[cardIndex];
          let next = processAction(s, { type: "PLAY_CARD", playerIndex: s.currentTurn, cardIndex });

          // If Joker was played, also choose mode/suit
          if (isJokerCard(card) && next.phase === "joker-choice") {
            const decision = chooseJokerPlay(
              hand, s.currentTrick, s.trump,
              bid, won, p.aiDifficulty || "medium"
            );
            next = processAction(next, {
              type: "JOKER_CHOICE",
              playerIndex: s.currentTurn,
              mode: decision.mode,
              suit: (decision.suit || "hearts") as Suit,
            });
          }

          return next;
        });
      }, 400 + Math.random() * 1000);
      return () => clearTimer();
    }
  }, [gameState?.phase, gameState?.currentTurn, gameState?.handNumber, safeApply]);

  return {
    gameState,
    error,
    lastTrickWinner,
    initGame,
    placeBid,
    playCard,
    jokerChoice,
    nextHand,
  };
}
