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
import { HistPenaltyEffect } from "./HistPenaltyEffect";
import { BidAllWonAllEffect } from "./BidAllWonAllEffect";
import { LastTrickPopover } from "./LastTrickPopover";
import { playSound } from "@/lib/sounds";

interface GameBoardProps {
  gameState: GameState;
  myPlayerIndex: PlayerIndex;
  onBid: (bid: number) => void;
  onPlayCard: (cardIndex: number) => void;
  onJokerChoice: (mode: JokerMode, suit?: Suit) => void;
  onNextHand?: () => void;
}

export function GameBoard({ gameState, myPlayerIndex, onBid, onPlayCard, onJokerChoice, onNextHand }: GameBoardProps) {
  const [showJokerDialog, setShowJokerDialog] = useState(false);
  const [pendingCardIndex, setPendingCardIndex] = useState<number | null>(null);
  const [showScoreSheet, setShowScoreSheet] = useState(false);
  const [showLastTrick, setShowLastTrick] = useState(false);
  const lastTrickRef = useRef<TrickPlay[]>([]);
  const lastTrickWinnerRef = useRef("");

  const isMyTurn = gameState.currentTurn === myPlayerIndex;
  const myHand = gameState.hands[myPlayerIndex] || [];

  // Effects
  const [histEffect, setHistEffect] = useState<{ playerName: string; amount: number; penalizedPositions: ("top" | "bottom" | "left" | "right")[] } | null>(null);
  const [bidAllEffect, setBidAllEffect] = useState<{ playerName: string; score: number } | null>(null);
  const prevHC = useRef(0);
  const pendingHist = useRef<{ playerName: string; amount: number; penalizedPositions: ("top" | "bottom" | "left" | "right")[] } | null>(null);

  useEffect(() => {
    const c = gameState.handScores.length;
    if (c > prevHC.current && c > 0) {
      const last = gameState.handScores[c - 1];
      const ba = last.find(s => s.isBidAllWonAll);
      const hs = last.filter(s => s.isHistPenalty);
      if (ba && hs.length) {
        setBidAllEffect({ playerName: gameState.players[ba.playerIndex]?.name || "", score: ba.score });
        pendingHist.current = { playerName: hs.map(h => gameState.players[h.playerIndex]?.name).join(" & "), amount: hs[0].score, penalizedPositions: hs.map(h => positions[h.playerIndex]) };
      } else if (ba) setBidAllEffect({ playerName: gameState.players[ba.playerIndex]?.name || "", score: ba.score });
      else if (hs.length) setHistEffect({ playerName: hs.map(h => gameState.players[h.playerIndex]?.name).join(" & "), amount: hs[0].score, penalizedPositions: hs.map(h => positions[h.playerIndex]) });
    }
    prevHC.current = c;
  }, [gameState.handScores.length, gameState.handScores, gameState.players]);

  useEffect(() => {
    if (gameState.phase === "playing" && isMyTurn) playSound("yourTurn", 0.4);
  }, [gameState.phase, isMyTurn, gameState.currentTurn]);

  const legalIndices = gameState.phase === "playing" && isMyTurn
    ? getLegalCardIndices(myHand, gameState.currentTrick, gameState.trump) : [];

  const getPos = (i: number): "bottom" | "top" | "left" | "right" => {
    const r = (i - myPlayerIndex + 4) % 4;
    return (["bottom", "left", "top", "right"] as const)[r];
  };
  const positions: Record<number, "bottom" | "top" | "left" | "right"> = {};
  for (let i = 0; i < 4; i++) positions[i] = getPos(i);

  if (gameState.phase === "trick-result" && gameState.currentTrick.plays.length === 4) {
    lastTrickRef.current = [...gameState.currentTrick.plays];
    const tw = (gameState as any)._trickWinner ?? gameState.currentTurn;
    lastTrickWinnerRef.current = gameState.players[tw]?.name || "?";
  }

  const trickWinner = gameState.phase === "trick-result" ? ((gameState as any)._trickWinner ?? gameState.currentTurn) as PlayerIndex : null;

  const handleCard = useCallback((ci: number) => {
    if (!isMyTurn || gameState.phase !== "playing" || !legalIndices.includes(ci)) return;
    if (isJokerCard(myHand[ci])) { setPendingCardIndex(ci); setShowJokerDialog(true); return; }
    playSound("cardPlay", 0.5); onPlayCard(ci);
  }, [isMyTurn, gameState.phase, legalIndices, myHand, onPlayCard]);

  const handleJoker = useCallback((m: JokerMode, s?: Suit) => {
    setShowJokerDialog(false);
    if (pendingCardIndex !== null) { onPlayCard(pendingCardIndex); onJokerChoice(m, s); }
    setPendingCardIndex(null);
  }, [pendingCardIndex, onPlayCard, onJokerChoice]);

  const lastHS = gameState.handScores.length > 0 ? gameState.handScores[gameState.handScores.length - 1] : null;
  const isResult = gameState.phase === "hand-result" || gameState.phase === "set-result";

  const kingsBySet = useMemo(() => {
    const r: Record<number, number[]> = {};
    const h = gameState.handScores;
    for (const { set, s, e } of [{ set: 1, s: 0, e: 8 }, { set: 2, s: 8, e: 12 }, { set: 3, s: 12, e: 20 }, { set: 4, s: 20, e: 24 }]) {
      if (h.length < e) continue;
      const ks: number[] = [];
      for (let p = 0; p < 4; p++) if (h.slice(s, e).every(hand => hand[p]?.isSuccess)) ks.push(p);
      if (ks.length) r[set] = ks;
    }
    return r;
  }, [gameState.handScores]);

  // Player at each position
  const pAt = (pos: string) => {
    const idx = Object.entries(positions).find(([, v]) => v === pos)?.[0];
    return idx !== undefined ? { i: Number(idx), p: gameState.players[Number(idx)] } : null;
  };

  const top = pAt("top"), left = pAt("left"), right = pAt("right");

  const trumpSym: Record<string, { s: string; c: string }> = {
    hearts: { s: "♥", c: "text-red-500" }, diamonds: { s: "♦", c: "text-red-500" },
    clubs: { s: "♣", c: "text-marble-200" }, spades: { s: "♠", c: "text-marble-200" },
  };

  const renderPlayer = (data: { i: number; p: any } | null, pos: string, compact = false) => {
    if (!data) return null;
    const { i, p } = data;
    return (
      <div className="flex flex-col items-center gap-0.5">
        <PlayerSlot name={p.name} bid={gameState.bidState.bids[i]} tricksWon={gameState.tricksWon[i]}
          score={gameState.scores[i]} isDealer={gameState.dealerIndex === i}
          isCurrentTurn={gameState.currentTurn === i} isConnected={true} isAI={p.isAI}
          position={pos as any} compact={compact} />
      </div>
    );
  };

  return (
    <>
      {/* Landscape prompt for portrait phones */}
      <div className="landscape-prompt royal-bg text-gold-300">
        <div className="text-4xl">📱</div>
        <div className="text-lg font-display font-bold">Rotate Your Phone</div>
        <div className="text-sm text-marble-400/50">Please switch to landscape mode to play</div>
        <div className="text-3xl animate-pulse mt-2">↻</div>
      </div>

      <div className="game-layout royal-bg select-none">
        {/* TOP ROW: header full width */}
        <header className="flex items-center justify-between px-3 py-1 bg-navy-900/70 safe-top text-[9px] md:text-[11px]"
          style={{ gridColumn: "1 / -1" }}>
          <div className="flex items-center gap-2">
            <span className="text-gold-300/40 cursor-pointer">☰</span>
            <button className="text-[8px] text-gold-300/30 hover:text-gold-300" onClick={() => { setShowScoreSheet(!showScoreSheet); setShowLastTrick(false); }}>📋</button>
            <button className="text-[8px] text-gold-300/30 hover:text-gold-300" onClick={() => { setShowLastTrick(!showLastTrick); setShowScoreSheet(false); }}>👁</button>
          </div>
          <div className="flex items-center gap-2 text-marble-400/50">
            <span className="text-gold-300/40 tracking-widest uppercase font-display text-[8px] md:text-[10px]">Joker</span>
            <span className="text-gold-300/15">|</span>
            <span>d:<b className="text-gold-300">{gameState.currentHandConfig.cardsPerPlayer}</b></span>
            {gameState.trump.suit && trumpSym[gameState.trump.suit] && (
              <span className={`text-sm ${trumpSym[gameState.trump.suit].c}`}>{trumpSym[gameState.trump.suit].s}</span>
            )}
            {gameState.trump.isNoTrump && <span className="italic text-marble-400/30">NT</span>}
          </div>
          <button className="text-gold-300/40 hover:text-gold-300" onClick={() => {
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
            else document.documentElement.requestFullscreen().catch(() => {});
          }}>⛶</button>
        </header>

        {/* MIDDLE ROW: left player | center table | right player */}
        {/* Left player */}
        <div className="flex flex-col items-center justify-center px-2 py-1 gap-1">
          {left && renderPlayer(left, "left", true)}
          {left && <OpponentHand cardCount={gameState.hands[left.i]?.length || 0} position="left" />}
        </div>

        {/* Center — the table */}
        <div className="relative flex flex-col items-center justify-between py-1 overflow-hidden">
          {/* Top player at top of center */}
          <div className="flex items-center gap-2">
            {top && renderPlayer(top, "top")}
            {top && <OpponentHand cardCount={gameState.hands[top.i]?.length || 0} position="top" />}
          </div>

          {/* Trick zone in center */}
          <div className="flex-1 flex items-center justify-center w-full">
            <TrickArea plays={gameState.currentTrick.plays} playerPositions={positions}
              trumpCard={gameState.trump.card} trickWinner={trickWinner} phase={gameState.phase} />
          </div>

          {/* My info + bid at bottom of center */}
          <div className="flex items-center gap-2 px-2">
            <span className="text-[10px] md:text-xs text-gold-300 font-bold truncate max-w-[80px]">
              {gameState.players[myPlayerIndex]?.name}
            </span>
            <span className="text-[9px] md:text-[11px] text-marble-400/40">
              b:<b className="text-gold-300">{gameState.bidState.bids[myPlayerIndex] ?? "-"}</b>
              <span className="mx-0.5 text-marble-500/15">·</span>
              w:<b className="text-gold-300">{gameState.tricksWon[myPlayerIndex]}</b>
            </span>
            <AnimatePresence>
              {gameState.phase === "bidding" && isMyTurn && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                  <BidPanel playerName="" cardsPerPlayer={gameState.currentHandConfig.cardsPerPlayer}
                    restrictedBid={gameState.bidState.restrictedBid} isDealer={gameState.dealerIndex === myPlayerIndex}
                    existingBids={gameState.bidState.bids} playerNames={gameState.players.map(p => p.name)} onBid={onBid} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Score sheet overlay */}
          {showScoreSheet && (
            <div className="absolute top-0 left-0 z-20 max-h-full overflow-auto">
              <ScoreBoard players={gameState.players} scores={gameState.scores} handScores={gameState.handScores}
                currentHand={gameState.handNumber} kingsBySet={kingsBySet} />
            </div>
          )}
          <LastTrickPopover lastTrick={lastTrickRef.current} winnerName={lastTrickWinnerRef.current}
            isOpen={showLastTrick} onClose={() => setShowLastTrick(false)} />
        </div>

        {/* Right player */}
        <div className="flex flex-col items-center justify-center px-2 py-1 gap-1">
          {right && renderPlayer(right, "right", true)}
          {right && <OpponentHand cardCount={gameState.hands[right.i]?.length || 0} position="right" />}
        </div>

        {/* BOTTOM ROW: my cards full width */}
        <div className="safe-bottom flex items-center justify-center px-2" style={{ gridColumn: "1 / -1" }}>
          <PlayerHand cards={myHand} legalIndices={legalIndices} onCardClick={handleCard}
            isCurrentPlayer={isMyTurn && gameState.phase === "playing"} />
        </div>

        {/* Overlays */}
        <AnimatePresence>
          {isResult && lastHS && (
            <HandResultOverlay handNumber={gameState.handNumber} handScores={lastHS} players={gameState.players}
              cumulativeScores={gameState.scores} isSetEnd={gameState.phase === "set-result"} onNext={() => onNextHand?.()} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {gameState.phase === "game-over" && <GameOverOverlay players={gameState.players} scores={gameState.scores} />}
        </AnimatePresence>
        <AnimatePresence>
          {showJokerDialog && (
            <JokerDialog isLeading={gameState.currentTrick.plays.length === 0} onConfirm={handleJoker}
              onCancel={() => { setShowJokerDialog(false); setPendingCardIndex(null); }} />
          )}
        </AnimatePresence>
        <HistPenaltyEffect playerName={histEffect?.playerName || ""} amount={histEffect?.amount || -200}
          isVisible={!!histEffect} onComplete={() => setHistEffect(null)}
          penalizedPositions={histEffect?.penalizedPositions} />
        <BidAllWonAllEffect playerName={bidAllEffect?.playerName || ""} score={bidAllEffect?.score || 0}
          isVisible={!!bidAllEffect} onComplete={() => {
            setBidAllEffect(null);
            if (pendingHist.current) { setTimeout(() => { setHistEffect(pendingHist.current); pendingHist.current = null; }, 500); }
          }} />
      </div>
    </>
  );
}
