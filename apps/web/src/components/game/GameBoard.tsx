"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import type { GameState, PlayerIndex, Suit, JokerMode, TrickPlay } from "@joker/engine";
import { getLegalCardIndices, isJokerCard } from "@joker/engine";
import { PlayerHand, OpponentHand } from "../cards/PlayerHand";
import { Card } from "../cards/Card";
import { TrickArea } from "./TrickArea";
import { PlayerSlot } from "./PlayerSlot";
import { TrumpIndicator } from "./TrumpIndicator";
import { BidPanel } from "./BidPanel";
import { JokerDialog } from "./JokerDialog";
import { ScoreBoard } from "./ScoreBoard";
import { HandResultOverlay } from "./HandResultOverlay";
import { GameOverOverlay } from "./GameOverOverlay";
import { TavernChatter } from "./TavernChatter";
import { LastTrickPopover } from "./LastTrickPopover";
import { HistPenaltyEffect } from "./HistPenaltyEffect";
import { BidAllWonAllEffect } from "./BidAllWonAllEffect";
import { playSound } from "@/lib/sounds";

interface GameBoardProps {
  gameState: GameState;
  myPlayerIndex: PlayerIndex;
  onBid: (bid: number) => void;
  onPlayCard: (cardIndex: number) => void;
  onJokerChoice: (mode: JokerMode, suit?: Suit) => void;
  onNextHand?: () => void;
}

export function GameBoard({
  gameState,
  myPlayerIndex,
  onBid,
  onPlayCard,
  onJokerChoice,
  onNextHand,
}: GameBoardProps) {
  const [showJokerDialog, setShowJokerDialog] = useState(false);
  const [pendingCardIndex, setPendingCardIndex] = useState<number | null>(null);
  const [showScoreSheet, setShowScoreSheet] = useState(false);
  const [showLastTrick, setShowLastTrick] = useState(false);
  const lastCompletedTrickRef = useRef<TrickPlay[]>([]);
  const lastTrickWinnerRef = useRef<string>("");

  const isMyTurn = gameState.currentTurn === myPlayerIndex;
  const myHand = gameState.hands[myPlayerIndex] || [];

  // Special effects state
  const [histPenaltyEffect, setHistPenaltyEffect] = useState<{
    playerName: string;
    amount: number;
  } | null>(null);
  const [bidAllEffect, setBidAllEffect] = useState<{
    playerName: string;
    score: number;
  } | null>(null);
  const prevHandCountRef = useRef(0);

  // Queued hist penalty (waits for bid-all video to finish)
  const pendingHistRef = useRef<{ playerName: string; amount: number } | null>(null);

  // Detect special scoring events when hand results appear
  useEffect(() => {
    const currentHandCount = gameState.handScores.length;
    if (currentHandCount > prevHandCountRef.current && currentHandCount > 0) {
      const lastScores = gameState.handScores[currentHandCount - 1];

      const bidAllPlayer = lastScores.find((s) => s.isBidAllWonAll);
      // Find ALL players who got hist penalty (could be multiple)
      const histPlayers = lastScores.filter((s) => s.isHistPenalty);

      if (bidAllPlayer && histPlayers.length > 0) {
        // BOTH happened: play video FIRST, queue hist penalty for after
        const bidName = gameState.players[bidAllPlayer.playerIndex]?.name || "Player";
        setBidAllEffect({ playerName: bidName, score: bidAllPlayer.score });
        const names = histPlayers.map((h) => gameState.players[h.playerIndex]?.name || "Player").join(" & ");
        pendingHistRef.current = { playerName: names, amount: histPlayers[0].score };
      } else if (bidAllPlayer) {
        const name = gameState.players[bidAllPlayer.playerIndex]?.name || "Player";
        setBidAllEffect({ playerName: name, score: bidAllPlayer.score });
      } else if (histPlayers.length > 0) {
        // Show effect for all penalized players
        const names = histPlayers.map((h) => gameState.players[h.playerIndex]?.name || "Player").join(" & ");
        setHistPenaltyEffect({ playerName: names, amount: histPlayers[0].score });
      }
    }
    prevHandCountRef.current = currentHandCount;
  }, [gameState.handScores.length, gameState.handScores, gameState.players]);

  // Play sounds for game events
  useEffect(() => {
    if (gameState.phase === "playing" && isMyTurn) {
      playSound("yourTurn", 0.4);
    }
  }, [gameState.phase, isMyTurn, gameState.currentTurn]);

  const legalIndices =
    gameState.phase === "playing" && isMyTurn
      ? getLegalCardIndices(myHand, gameState.currentTrick, gameState.trump)
      : [];

  const getPosition = (idx: number): "bottom" | "top" | "left" | "right" => {
    const relative = (idx - myPlayerIndex + 4) % 4;
    return (["bottom", "left", "top", "right"] as const)[relative];
  };

  const playerPositions: Record<number, "bottom" | "top" | "left" | "right"> = {};
  for (let i = 0; i < 4; i++) playerPositions[i] = getPosition(i);

  // Save completed trick for "Last Trick" popover
  if (
    gameState.phase === "trick-result" &&
    gameState.currentTrick.plays.length === 4
  ) {
    lastCompletedTrickRef.current = [...gameState.currentTrick.plays];
    const trickState = gameState as GameState & { _trickWinner?: PlayerIndex };
    const w = trickState._trickWinner ?? gameState.currentTurn;
    lastTrickWinnerRef.current = gameState.players[w]?.name || "?";
  }

  const handleCardClick = useCallback(
    (cardIndex: number) => {
      if (!isMyTurn || gameState.phase !== "playing") return;
      if (!legalIndices.includes(cardIndex)) return;
      const card = myHand[cardIndex];
      if (isJokerCard(card)) {
        setPendingCardIndex(cardIndex);
        setShowJokerDialog(true);
        return;
      }
      playSound("cardPlay", 0.5);
      onPlayCard(cardIndex);
    },
    [isMyTurn, gameState.phase, legalIndices, myHand, onPlayCard]
  );

  const handleJokerConfirm = useCallback(
    (mode: JokerMode, suit?: Suit) => {
      setShowJokerDialog(false);
      if (pendingCardIndex !== null) {
        onPlayCard(pendingCardIndex);
        onJokerChoice(mode, suit);
      }
      setPendingCardIndex(null);
    },
    [pendingCardIndex, onPlayCard, onJokerChoice]
  );

  // Get the last hand scores for overlay
  const lastHandScores =
    gameState.handScores.length > 0
      ? gameState.handScores[gameState.handScores.length - 1]
      : null;

  // Compute kings by set for score table crown icons
  const kingsBySet = useMemo(() => {
    const result: Record<number, number[]> = {};
    // Check each completed set for kings (players who succeeded ALL bids)
    const handSeq = gameState.handScores;
    const setBounds = [
      { set: 1, start: 0, end: 8 },
      { set: 2, start: 8, end: 12 },
      { set: 3, start: 12, end: 20 },
      { set: 4, start: 20, end: 24 },
    ];
    for (const { set, start, end } of setBounds) {
      if (handSeq.length < end) continue; // Set not complete
      const setHands = handSeq.slice(start, end);
      const kings: number[] = [];
      for (let p = 0; p < 4; p++) {
        const allSuccess = setHands.every((hand) => hand[p]?.isSuccess);
        if (allSuccess) kings.push(p);
      }
      if (kings.length > 0) result[set] = kings;
    }
    return result;
  }, [gameState.handScores]);

  const isResultPhase =
    gameState.phase === "hand-result" || gameState.phase === "set-result";

  return (
    <div className="game-no-scroll royal-bg select-none flex flex-col">
      {/* Header */}
      <header className="relative z-20 px-4 py-2.5 flex items-center justify-between bg-navy-900/80 backdrop-blur-md shadow-2xl">
        <span className="text-gold-300/40 text-lg cursor-pointer">☰</span>
        <h1 className="font-display text-xs font-bold text-gold-300 uppercase tracking-[0.25em]">
          The Sovereign Table
        </h1>
        <div className="w-8 h-8 rounded-full bg-navy-800 border-2 border-gold-600/30 flex items-center justify-center text-sm">
          👤
        </div>
      </header>

      {/* Trump info */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20">
        <TrumpIndicator
          trump={gameState.trump}
          handNumber={gameState.handNumber}
          setNumber={gameState.currentSet}
          cardsPerPlayer={gameState.currentHandConfig.cardsPerPlayer}
        />
      </div>

      {/* TOP PLAYER */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1">
        {gameState.players.map((p, i) =>
          getPosition(i) === "top" ? (
            <div key={i} className="flex flex-col items-center gap-1">
              <PlayerSlot
                name={p.name} bid={gameState.bidState.bids[i]}
                tricksWon={gameState.tricksWon[i]} score={gameState.scores[i]}
                isDealer={gameState.dealerIndex === i} isCurrentTurn={gameState.currentTurn === i}
                isConnected={true} isAI={p.isAI} position="top"
              />
              <OpponentHand cardCount={gameState.hands[i]?.length || 0} position="top" />
            </div>
          ) : null
        )}
      </div>

      {/* LEFT PLAYER */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1">
        {gameState.players.map((p, i) =>
          getPosition(i) === "left" ? (
            <div key={i} className="flex items-center gap-1">
              <PlayerSlot
                name={p.name} bid={gameState.bidState.bids[i]}
                tricksWon={gameState.tricksWon[i]} score={gameState.scores[i]}
                isDealer={gameState.dealerIndex === i} isCurrentTurn={gameState.currentTurn === i}
                isConnected={true} isAI={p.isAI} position="left"
              />
              <OpponentHand cardCount={gameState.hands[i]?.length || 0} position="left" />
            </div>
          ) : null
        )}
      </div>

      {/* RIGHT PLAYER */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1">
        {gameState.players.map((p, i) =>
          getPosition(i) === "right" ? (
            <div key={i} className="flex items-center gap-1">
              <OpponentHand cardCount={gameState.hands[i]?.length || 0} position="right" />
              <PlayerSlot
                name={p.name} bid={gameState.bidState.bids[i]}
                tricksWon={gameState.tricksWon[i]} score={gameState.scores[i]}
                isDealer={gameState.dealerIndex === i} isCurrentTurn={gameState.currentTurn === i}
                isConnected={true} isAI={p.isAI} position="right"
              />
            </div>
          ) : null
        )}
      </div>

      {/* CENTER: Trick Area + Trump card on table */}
      <div className="absolute inset-0 flex items-center justify-center">
        <TrickArea plays={gameState.currentTrick.plays} playerPositions={playerPositions} />

        {/* Trump (stuffing) card shown face-up on the table */}
        {gameState.trump.card && (
          <div className="absolute top-1/2 right-[calc(50%-180px)] -translate-y-1/2 opacity-90 rotate-3">
            <Card card={gameState.trump.card} small isPlayable={false} />
          </div>
        )}
      </div>

      {/* Tavern Chatter */}
      <TavernChatter gameState={gameState} />

      {/* SIDE BUTTONS */}
      <div className="absolute right-3 bottom-[140px] z-20 flex flex-col gap-2">
        <button
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-navy-800/60 backdrop-blur-sm text-marble-400/60 hover:text-gold-300 transition-colors text-[9px] font-body font-semibold uppercase"
          onClick={() => { setShowScoreSheet(!showScoreSheet); setShowLastTrick(false); }}
        >
          <span className="text-base">📋</span>Score
        </button>
        <button
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-navy-800/60 backdrop-blur-sm text-marble-400/60 hover:text-gold-300 transition-colors text-[9px] font-body font-semibold uppercase"
          onClick={() => { setShowLastTrick(!showLastTrick); setShowScoreSheet(false); }}
        >
          <span className="text-base">👁</span>Last
        </button>
      </div>

      {/* Score sheet overlay */}
      {showScoreSheet && (
        <div className="absolute right-3 top-14 z-30">
          <ScoreBoard
            players={gameState.players}
            scores={gameState.scores}
            handScores={gameState.handScores}
            currentHand={gameState.handNumber}
            kingsBySet={kingsBySet}
          />
        </div>
      )}

      {/* Last trick popover */}
      <LastTrickPopover
        lastTrick={lastCompletedTrickRef.current}
        winnerName={lastTrickWinnerRef.current}
        isOpen={showLastTrick}
        onClose={() => setShowLastTrick(false)}
      />

      {/* BOTTOM: My player + hand */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="flex items-center justify-center gap-3 mb-1">
          <PlayerSlot
            name={gameState.players[myPlayerIndex]?.name || "You"}
            bid={gameState.bidState.bids[myPlayerIndex]}
            tricksWon={gameState.tricksWon[myPlayerIndex]}
            score={gameState.scores[myPlayerIndex]}
            isDealer={gameState.dealerIndex === myPlayerIndex}
            isCurrentTurn={isMyTurn}
            isConnected={true} isAI={false} position="bottom"
          />
          <div className="text-xs font-body text-marble-400/40">
            <span>order: <strong className="text-gold-300">{gameState.bidState.bids[myPlayerIndex] ?? "..."}</strong></span>
            <span className="mx-2 text-marble-500/20">|</span>
            <span>taken: <strong className="text-gold-300">{gameState.tricksWon[myPlayerIndex]}</strong></span>
          </div>
        </div>

        {/* Bidding overlay */}
        {gameState.phase === "bidding" && isMyTurn && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30">
            <BidPanel
              playerName={gameState.players[myPlayerIndex]?.name || "You"}
              cardsPerPlayer={gameState.currentHandConfig.cardsPerPlayer}
              restrictedBid={gameState.bidState.restrictedBid}
              isDealer={gameState.dealerIndex === myPlayerIndex}
              existingBids={gameState.bidState.bids}
              playerNames={gameState.players.map((p) => p.name)}
              onBid={onBid}
            />
          </div>
        )}

        <div className="pb-3">
          <PlayerHand
            cards={myHand}
            legalIndices={legalIndices}
            onCardClick={handleCardClick}
            isCurrentPlayer={isMyTurn && gameState.phase === "playing"}
          />
        </div>
      </div>

      {/* ── RESULT OVERLAYS ── */}
      <AnimatePresence>
        {isResultPhase && lastHandScores && (
          <HandResultOverlay
            handNumber={gameState.handNumber}
            handScores={lastHandScores}
            players={gameState.players}
            cumulativeScores={gameState.scores}
            isSetEnd={gameState.phase === "set-result"}
            onNext={() => onNextHand?.()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameState.phase === "game-over" && (
          <GameOverOverlay
            players={gameState.players}
            scores={gameState.scores}
          />
        )}
      </AnimatePresence>

      {/* Joker dialog */}
      <AnimatePresence>
        {showJokerDialog && (
          <JokerDialog
            isLeading={gameState.currentTrick.plays.length === 0}
            onConfirm={handleJokerConfirm}
            onCancel={() => { setShowJokerDialog(false); setPendingCardIndex(null); }}
          />
        )}
      </AnimatePresence>

      {/* Hist Penalty Effect — sad emoji rain */}
      <HistPenaltyEffect
        playerName={histPenaltyEffect?.playerName || ""}
        amount={histPenaltyEffect?.amount || -200}
        isVisible={!!histPenaltyEffect}
        onComplete={() => setHistPenaltyEffect(null)}
      />

      {/* Bid All Won All Effect — winner video */}
      <BidAllWonAllEffect
        playerName={bidAllEffect?.playerName || ""}
        score={bidAllEffect?.score || 0}
        isVisible={!!bidAllEffect}
        onComplete={() => {
          setBidAllEffect(null);
          // If there's a queued hist penalty, play it now
          if (pendingHistRef.current) {
            setTimeout(() => {
              setHistPenaltyEffect(pendingHistRef.current);
              pendingHistRef.current = null;
            }, 500);
          }
        }}
      />
    </div>
  );
}
