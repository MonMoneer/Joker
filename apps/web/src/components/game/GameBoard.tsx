"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GameState, PlayerIndex, Suit, JokerMode, TrickPlay } from "@joker/engine";
import { getLegalCardIndices, isJokerCard } from "@joker/engine";
import { PlayerHand, OpponentHand } from "../cards/PlayerHand";
import { Card } from "../cards/Card";
import { TrickArea } from "./TrickArea";
import { PlayerSlot } from "./PlayerSlot";
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
  gameState, myPlayerIndex, onBid, onPlayCard, onJokerChoice, onNextHand,
}: GameBoardProps) {
  const [showJokerDialog, setShowJokerDialog] = useState(false);
  const [pendingCardIndex, setPendingCardIndex] = useState<number | null>(null);
  const [showScoreSheet, setShowScoreSheet] = useState(false);
  const [showLastTrick, setShowLastTrick] = useState(false);
  const lastCompletedTrickRef = useRef<TrickPlay[]>([]);
  const lastTrickWinnerRef = useRef<string>("");

  const isMyTurn = gameState.currentTurn === myPlayerIndex;
  const myHand = gameState.hands[myPlayerIndex] || [];

  // Special effects
  const [histPenaltyEffect, setHistPenaltyEffect] = useState<{ playerName: string; amount: number } | null>(null);
  const [bidAllEffect, setBidAllEffect] = useState<{ playerName: string; score: number } | null>(null);
  const prevHandCountRef = useRef(0);
  const pendingHistRef = useRef<{ playerName: string; amount: number } | null>(null);

  useEffect(() => {
    const c = gameState.handScores.length;
    if (c > prevHandCountRef.current && c > 0) {
      const last = gameState.handScores[c - 1];
      const bidAll = last.find((s) => s.isBidAllWonAll);
      const hists = last.filter((s) => s.isHistPenalty);
      if (bidAll && hists.length > 0) {
        setBidAllEffect({ playerName: gameState.players[bidAll.playerIndex]?.name || "Player", score: bidAll.score });
        pendingHistRef.current = { playerName: hists.map((h) => gameState.players[h.playerIndex]?.name).join(" & "), amount: hists[0].score };
      } else if (bidAll) {
        setBidAllEffect({ playerName: gameState.players[bidAll.playerIndex]?.name || "Player", score: bidAll.score });
      } else if (hists.length > 0) {
        setHistPenaltyEffect({ playerName: hists.map((h) => gameState.players[h.playerIndex]?.name).join(" & "), amount: hists[0].score });
      }
    }
    prevHandCountRef.current = c;
  }, [gameState.handScores.length, gameState.handScores, gameState.players]);

  useEffect(() => {
    if (gameState.phase === "playing" && isMyTurn) playSound("yourTurn", 0.4);
  }, [gameState.phase, isMyTurn, gameState.currentTurn]);

  const legalIndices = gameState.phase === "playing" && isMyTurn
    ? getLegalCardIndices(myHand, gameState.currentTrick, gameState.trump) : [];

  const getPosition = (idx: number): "bottom" | "top" | "left" | "right" => {
    const r = (idx - myPlayerIndex + 4) % 4;
    return (["bottom", "left", "top", "right"] as const)[r];
  };
  const playerPositions: Record<number, "bottom" | "top" | "left" | "right"> = {};
  for (let i = 0; i < 4; i++) playerPositions[i] = getPosition(i);

  // Save trick for Last Trick popover
  if (gameState.phase === "trick-result" && gameState.currentTrick.plays.length === 4) {
    lastCompletedTrickRef.current = [...gameState.currentTrick.plays];
    const ts = gameState as GameState & { _trickWinner?: PlayerIndex };
    lastTrickWinnerRef.current = gameState.players[ts._trickWinner ?? gameState.currentTurn]?.name || "?";
  }

  const trickWinner = gameState.phase === "trick-result"
    ? ((gameState as any)._trickWinner ?? gameState.currentTurn) as PlayerIndex
    : null;

  const handleCardClick = useCallback((cardIndex: number) => {
    if (!isMyTurn || gameState.phase !== "playing" || !legalIndices.includes(cardIndex)) return;
    const card = myHand[cardIndex];
    if (isJokerCard(card)) { setPendingCardIndex(cardIndex); setShowJokerDialog(true); return; }
    playSound("cardPlay", 0.5);
    onPlayCard(cardIndex);
  }, [isMyTurn, gameState.phase, legalIndices, myHand, onPlayCard]);

  const handleJokerConfirm = useCallback((mode: JokerMode, suit?: Suit) => {
    setShowJokerDialog(false);
    if (pendingCardIndex !== null) { onPlayCard(pendingCardIndex); onJokerChoice(mode, suit); }
    setPendingCardIndex(null);
  }, [pendingCardIndex, onPlayCard, onJokerChoice]);

  const lastHandScores = gameState.handScores.length > 0 ? gameState.handScores[gameState.handScores.length - 1] : null;
  const isResultPhase = gameState.phase === "hand-result" || gameState.phase === "set-result";

  const kingsBySet = useMemo(() => {
    const result: Record<number, number[]> = {};
    const h = gameState.handScores;
    const bounds = [{ set: 1, s: 0, e: 8 }, { set: 2, s: 8, e: 12 }, { set: 3, s: 12, e: 20 }, { set: 4, s: 20, e: 24 }];
    for (const { set, s, e } of bounds) {
      if (h.length < e) continue;
      const sh = h.slice(s, e);
      const kings: number[] = [];
      for (let p = 0; p < 4; p++) { if (sh.every((hand) => hand[p]?.isSuccess)) kings.push(p); }
      if (kings.length > 0) result[set] = kings;
    }
    return result;
  }, [gameState.handScores]);

  // Helper to render a side player (left or right column)
  const renderSidePlayer = (pos: "left" | "right") => {
    const idx = Object.entries(playerPositions).find(([, v]) => v === pos)?.[0];
    if (!idx) return null;
    const i = Number(idx);
    const p = gameState.players[i];
    if (!p) return null;

    return (
      <div className="flex flex-col items-center justify-between h-full py-1 md:py-2">
        <div className="flex flex-col items-center gap-0.5">
          <PlayerSlot
            name={p.name} bid={gameState.bidState.bids[i]} tricksWon={gameState.tricksWon[i]}
            score={gameState.scores[i]} isDealer={gameState.dealerIndex === i}
            isCurrentTurn={gameState.currentTurn === i} isConnected={true} isAI={p.isAI}
            position={pos} compact
          />
          <OpponentHand cardCount={gameState.hands[i]?.length || 0} position={pos} />
        </div>
        {/* Action button */}
        <button
          className="w-8 h-7 md:w-10 md:h-9 bg-navy-800/70 rounded-md flex flex-col items-center justify-center border border-gold-400/10 text-[8px] md:text-[10px]"
          onClick={() => {
            if (pos === "left") { setShowScoreSheet(!showScoreSheet); setShowLastTrick(false); }
            else { setShowLastTrick(!showLastTrick); setShowScoreSheet(false); }
          }}
        >
          <span className="text-xs md:text-sm">{pos === "left" ? "📋" : "👁"}</span>
        </button>
      </div>
    );
  };

  // Get top player
  const topIdx = Object.entries(playerPositions).find(([, v]) => v === "top")?.[0];
  const topPlayer = topIdx ? gameState.players[Number(topIdx)] : null;
  const ti = topIdx ? Number(topIdx) : 0;

  // Trump suit info for header
  const trumpSuit = gameState.trump.suit;
  const trumpSymbols: Record<string, { sym: string; cls: string }> = {
    hearts: { sym: "♥", cls: "text-red-500" }, diamonds: { sym: "♦", cls: "text-red-500" },
    clubs: { sym: "♣", cls: "text-marble-200" }, spades: { sym: "♠", cls: "text-marble-200" },
  };

  return (
    <div className="game-grid royal-bg select-none">
      {/* ROW 1: Header (full width) */}
      <header className="col-span-3 flex items-center justify-between px-3 py-1.5 md:px-4 md:py-2 bg-navy-900/80 backdrop-blur-md safe-top" style={{ gridColumn: "1 / -1" }}>
        <span className="text-gold-300/40 text-sm cursor-pointer">☰</span>
        <div className="flex items-center gap-2 md:gap-3 text-[8px] md:text-[10px]">
          <span className="text-gold-300/50 tracking-widest uppercase hidden md:inline">The Sovereign Table</span>
          <span className="text-gold-300/50 tracking-wider uppercase md:hidden">Table</span>
          <span className="text-gold-300/20">|</span>
          <span className="text-marble-400/50">d:<b className="text-gold-300">{gameState.currentHandConfig.cardsPerPlayer}</b></span>
          {trumpSuit && trumpSymbols[trumpSuit] && (
            <span className={`text-sm md:text-base ${trumpSymbols[trumpSuit].cls}`}>{trumpSymbols[trumpSuit].sym}</span>
          )}
          {gameState.trump.isNoTrump && <span className="text-marble-400/30 italic">no trump</span>}
        </div>
        <button className="text-gold-300/40 text-sm" onClick={() => {
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
          else document.documentElement.requestFullscreen().catch(() => {});
        }}>⛶</button>
      </header>

      {/* ROW 2: Top player (full width) */}
      <div className="flex flex-col items-center justify-center gap-0.5 py-1 md:py-2" style={{ gridColumn: "1 / -1" }}>
        {topPlayer && (
          <>
            <div className="flex items-center gap-2 md:gap-3">
              <PlayerSlot
                name={topPlayer.name} bid={gameState.bidState.bids[ti]} tricksWon={gameState.tricksWon[ti]}
                score={gameState.scores[ti]} isDealer={gameState.dealerIndex === ti}
                isCurrentTurn={gameState.currentTurn === ti} isConnected={true} isAI={topPlayer.isAI}
                position="top"
              />
            </div>
            <OpponentHand cardCount={gameState.hands[ti]?.length || 0} position="top" />
          </>
        )}
      </div>

      {/* ROW 3 COL 1: Left player */}
      <div className="overflow-hidden">{renderSidePlayer("left")}</div>

      {/* ROW 3 COL 2: Trick zone (center) */}
      <div className="flex items-center justify-center overflow-hidden relative">
        <TrickArea
          plays={gameState.currentTrick.plays}
          playerPositions={playerPositions}
          trumpCard={gameState.trump.card}
          trickWinner={trickWinner}
          phase={gameState.phase}
        />

        {/* Score sheet overlay */}
        {showScoreSheet && (
          <div className="absolute inset-0 z-20 flex items-start justify-center pt-2 overflow-auto">
            <ScoreBoard players={gameState.players} scores={gameState.scores} handScores={gameState.handScores} currentHand={gameState.handNumber} kingsBySet={kingsBySet} />
          </div>
        )}

        {/* Last trick popover */}
        <LastTrickPopover
          lastTrick={lastCompletedTrickRef.current}
          winnerName={lastTrickWinnerRef.current}
          isOpen={showLastTrick}
          onClose={() => setShowLastTrick(false)}
        />
      </div>

      {/* ROW 3 COL 3: Right player */}
      <div className="overflow-hidden">{renderSidePlayer("right")}</div>

      {/* ROW 4: My info + bid buttons (full width) */}
      <div className="flex items-center justify-center gap-2 md:gap-3 px-2 py-1 bg-navy-900/40" style={{ gridColumn: "1 / -1" }}>
        <span className="text-[9px] md:text-[11px] text-gold-300 font-bold truncate max-w-[60px] md:max-w-[100px]">
          {gameState.players[myPlayerIndex]?.name}
        </span>
        <span className="text-[8px] md:text-[10px] text-marble-400/40">
          b:<b className="text-gold-300">{gameState.bidState.bids[myPlayerIndex] ?? "-"}</b>
          <span className="mx-0.5 text-marble-500/20">·</span>
          w:<b className="text-gold-300">{gameState.tricksWon[myPlayerIndex]}</b>
        </span>

        {/* Bid buttons inline */}
        <AnimatePresence>
          {gameState.phase === "bidding" && isMyTurn && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              <BidPanel
                playerName="" cardsPerPlayer={gameState.currentHandConfig.cardsPerPlayer}
                restrictedBid={gameState.bidState.restrictedBid}
                isDealer={gameState.dealerIndex === myPlayerIndex}
                existingBids={gameState.bidState.bids}
                playerNames={gameState.players.map((p) => p.name)}
                onBid={onBid}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ROW 5: My cards (full width) */}
      <div className="safe-bottom" style={{ gridColumn: "1 / -1" }}>
        <PlayerHand cards={myHand} legalIndices={legalIndices} onCardClick={handleCardClick} isCurrentPlayer={isMyTurn && gameState.phase === "playing"} />
      </div>

      {/* Tavern Chatter */}
      <TavernChatter gameState={gameState} />

      {/* Result overlays */}
      <AnimatePresence>
        {isResultPhase && lastHandScores && (
          <HandResultOverlay handNumber={gameState.handNumber} handScores={lastHandScores} players={gameState.players}
            cumulativeScores={gameState.scores} isSetEnd={gameState.phase === "set-result"} onNext={() => onNextHand?.()} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameState.phase === "game-over" && <GameOverOverlay players={gameState.players} scores={gameState.scores} />}
      </AnimatePresence>

      <AnimatePresence>
        {showJokerDialog && (
          <JokerDialog isLeading={gameState.currentTrick.plays.length === 0} onConfirm={handleJokerConfirm}
            onCancel={() => { setShowJokerDialog(false); setPendingCardIndex(null); }} />
        )}
      </AnimatePresence>

      <HistPenaltyEffect playerName={histPenaltyEffect?.playerName || ""} amount={histPenaltyEffect?.amount || -200}
        isVisible={!!histPenaltyEffect} onComplete={() => setHistPenaltyEffect(null)} />

      <BidAllWonAllEffect playerName={bidAllEffect?.playerName || ""} score={bidAllEffect?.score || 0}
        isVisible={!!bidAllEffect} onComplete={() => {
          setBidAllEffect(null);
          if (pendingHistRef.current) { setTimeout(() => { setHistPenaltyEffect(pendingHistRef.current); pendingHistRef.current = null; }, 500); }
        }} />
    </div>
  );
}
